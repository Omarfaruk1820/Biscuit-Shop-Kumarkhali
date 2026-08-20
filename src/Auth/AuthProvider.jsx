import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import axios from "axios";

import { auth } from "./firebase.config";

// ============================================================
// AUTH CONTEXT
// ============================================================

export const AuthContext = createContext(null);

// ============================================================
// API
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

if (!API_URL) {
  console.warn("VITE_API_URL is not configured.");
}

// ============================================================
// AXIOS INSTANCE
// ============================================================

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================
// GOOGLE PROVIDER
// ============================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ============================================================
// AUTH PROVIDER
// ============================================================

const AuthProvider = ({ children }) => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // GET FIREBASE ID TOKEN
  // ==========================================================

  const getFirebaseIdToken = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      throw new Error("Firebase user is unavailable.");
    }

    const token = await firebaseUser.getIdToken();

    if (!token) {
      throw new Error("Unable to get Firebase authentication token.");
    }

    return token;
  }, []);

  // ==========================================================
  // FIREBASE AUTH HEADER
  // ==========================================================

  const getFirebaseAuthConfig = useCallback(
    async (firebaseUser) => {
      const token = await getFirebaseIdToken(firebaseUser);

      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    },
    [getFirebaseIdToken],
  );

  // ==========================================================
  // SYNC FIREBASE USER WITH MONGODB
  //
  // POST /auth/register
  // ==========================================================

  const syncUserToDatabase = useCallback(
    async (firebaseUser, additionalData = {}) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is unavailable.");
      }

      const config = await getFirebaseAuthConfig(firebaseUser);

      const name =
        typeof additionalData.name === "string"
          ? additionalData.name.trim()
          : firebaseUser.displayName?.trim() || "";

      const photo =
        typeof additionalData.photo === "string"
          ? additionalData.photo.trim()
          : firebaseUser.photoURL?.trim() || "";

      const response = await api.post(
        "/auth/register",
        {
          name,
          photo,
        },
        config,
      );

      if (!response?.data?.success) {
        const error = new Error(
          response?.data?.message || "Failed to synchronize user account.",
        );

        error.response = response;

        throw error;
      }

      return response.data;
    },
    [getFirebaseAuthConfig],
  );

  // ==========================================================
  // CREATE APPLICATION SESSION
  //
  // POST /auth/jwt
  //
  // Server creates HTTP-only JWT cookie.
  // ==========================================================

  const createApplicationSession = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is unavailable.");
      }

      const config = await getFirebaseAuthConfig(firebaseUser);

      const response = await api.post("/auth/jwt", {}, config);

      if (!response?.data?.success) {
        const error = new Error(
          response?.data?.message || "Failed to create application session.",
        );

        error.code = response?.data?.code || "";
        error.response = response;

        throw error;
      }

      return response.data;
    },
    [getFirebaseAuthConfig],
  );

  // ==========================================================
  // GET CURRENT DATABASE USER
  //
  // GET /auth/me
  //
  // Uses HTTP-only application JWT cookie.
  // ==========================================================

  const getCurrentUser = useCallback(async () => {
    const response = await api.get("/auth/me");

    if (!response?.data?.success || !response?.data?.user) {
      const error = new Error(
        response?.data?.message || "Failed to load authenticated user.",
      );

      error.response = response;

      throw error;
    }

    return response.data.user;
  }, []);

  // ==========================================================
  // REGISTER
  //
  // Firebase
  //    ↓
  // updateProfile
  //    ↓
  // POST /auth/register
  //    ↓
  // sendEmailVerification
  //    ↓
  // Firebase signOut
  //
  // IMPORTANT:
  // Registration does NOT create application JWT.
  // ==========================================================

  const createUser = useCallback(
    async (email, password, name, photoURL = "") => {
      const cleanEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      const cleanName = typeof name === "string" ? name.trim() : "";

      const cleanPhoto = typeof photoURL === "string" ? photoURL.trim() : "";

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      // --------------------------------------------------------
      // CREATE FIREBASE ACCOUNT
      // --------------------------------------------------------

      const result = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Failed to create Firebase account.");
      }

      try {
        // ------------------------------------------------------
        // PROFILE PHOTO
        // ------------------------------------------------------

        const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          cleanName,
        )}&size=256`;

        const finalPhoto = cleanPhoto || fallbackPhoto;

        // ------------------------------------------------------
        // UPDATE FIREBASE PROFILE
        // ------------------------------------------------------

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: finalPhoto,
        });

        // ------------------------------------------------------
        // REFRESH FIREBASE USER
        // ------------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to load newly created Firebase user.");
        }

        // ------------------------------------------------------
        // SYNC WITH MONGODB
        //
        // POST /auth/register
        // ------------------------------------------------------

        await syncUserToDatabase(currentFirebaseUser, {
          name: cleanName,
          photo: finalPhoto,
        });

        // ------------------------------------------------------
        // SEND EMAIL VERIFICATION
        // ------------------------------------------------------

        if (!currentFirebaseUser.emailVerified) {
          await sendEmailVerification(currentFirebaseUser);
        }

        // ------------------------------------------------------
        // REGISTRATION DOES NOT LOGIN USER
        // ------------------------------------------------------

        await signOut(auth);

        setUser(null);

        return {
          success: true,
          user: null,
          firebaseUser: currentFirebaseUser,
          message:
            "Registration successful! Please verify your email before logging in.",
        };
      } catch (error) {
        // ------------------------------------------------------
        // CLEANUP FIREBASE SESSION
        // ------------------------------------------------------

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error(
            "REGISTER CLEANUP ERROR:",
            signOutError?.message || signOutError,
          );
        }

        setUser(null);

        throw error;
      }
    },
    [syncUserToDatabase],
  );

  // ==========================================================
  // EMAIL/PASSWORD LOGIN
  //
  // Firebase login
  //    ↓
  // email verification
  //    ↓
  // POST /auth/register
  //    ↓
  // POST /auth/jwt
  //    ↓
  // GET /auth/me
  //    ↓
  // setUser
  // ==========================================================

  const signInUser = useCallback(
    async (email, password) => {
      const cleanEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      // --------------------------------------------------------
      // FIREBASE LOGIN
      // --------------------------------------------------------

      const result = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Login failed.");
      }

      try {
        // ------------------------------------------------------
        // REFRESH FIREBASE USER
        // ------------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Authenticated Firebase user could not be loaded.");
        }

        // ------------------------------------------------------
        // EMAIL VERIFICATION
        // ------------------------------------------------------

        if (!currentFirebaseUser.emailVerified) {
          const error = new Error(
            "Please verify your email address before logging in.",
          );

          error.code = "auth/email-not-verified";

          throw error;
        }

        // ------------------------------------------------------
        // SYNC USER
        //
        // POST /auth/register
        // ------------------------------------------------------

        await syncUserToDatabase(currentFirebaseUser);

        // ------------------------------------------------------
        // CREATE APPLICATION SESSION
        //
        // POST /auth/jwt
        // ------------------------------------------------------

        const session = await createApplicationSession(currentFirebaseUser);

        // ------------------------------------------------------
        // GET DATABASE USER
        // ------------------------------------------------------

        const databaseUser = session?.user || (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your user account.");
        }

        // ------------------------------------------------------
        // SAVE USER STATE
        // ------------------------------------------------------

        setUser(databaseUser);

        return {
          success: true,
          user: databaseUser,
          message: "Login successful.",
        };
      } catch (error) {
        // ------------------------------------------------------
        // If application authentication fails, clean Firebase
        // session as well.
        // ------------------------------------------------------

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error(
            "LOGIN CLEANUP ERROR:",
            signOutError?.message || signOutError,
          );
        }

        setUser(null);

        throw error;
      }
    },
    [syncUserToDatabase, createApplicationSession, getCurrentUser],
  );

  // ==========================================================
  // GOOGLE LOGIN
  //
  // Firebase Google popup
  //    ↓
  // POST /auth/register
  //    ↓
  // POST /auth/jwt
  //    ↓
  // GET /auth/me
  //    ↓
  // setUser
  // ==========================================================

  const signInWithGoogle = useCallback(async () => {
    // --------------------------------------------------------
    // GOOGLE POPUP
    // --------------------------------------------------------

    const result = await signInWithPopup(auth, googleProvider);

    const firebaseUser = result?.user;

    if (!firebaseUser) {
      throw new Error("Google authentication failed.");
    }

    try {
      // ------------------------------------------------------
      // SYNC GOOGLE USER
      //
      // POST /auth/register
      // ------------------------------------------------------

      await syncUserToDatabase(firebaseUser, {
        name: firebaseUser.displayName || "",
        photo: firebaseUser.photoURL || "",
      });

      // ------------------------------------------------------
      // CREATE APPLICATION SESSION
      //
      // POST /auth/jwt
      // ------------------------------------------------------

      const session = await createApplicationSession(firebaseUser);

      // ------------------------------------------------------
      // GET DATABASE USER
      // ------------------------------------------------------

      const databaseUser = session?.user || (await getCurrentUser());

      if (!databaseUser) {
        throw new Error("Unable to load Google user account.");
      }

      // ------------------------------------------------------
      // SAVE USER STATE
      // ------------------------------------------------------

      setUser(databaseUser);

      return {
        success: true,
        user: databaseUser,
        message: "Google login successful.",
      };
    } catch (error) {
      // ------------------------------------------------------
      // CLEANUP IF BACKEND AUTHENTICATION FAILS
      // ------------------------------------------------------

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error(
          "GOOGLE LOGIN CLEANUP ERROR:",
          signOutError?.message || signOutError,
        );
      }

      setUser(null);

      throw error;
    }
  }, [syncUserToDatabase, createApplicationSession, getCurrentUser]);

  // ==========================================================
  // LOGOUT
  //
  // POST /auth/logout
  //    ↓
  // Firebase signOut
  //    ↓
  // setUser(null)
  // ==========================================================

  const logOutUser = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "BACKEND LOGOUT ERROR:",
        error?.response?.data || error?.message || error,
      );
    } finally {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("FIREBASE LOGOUT ERROR:", error?.message || error);
      }

      setUser(null);
    }
  }, []);

  // ==========================================================
  // RESEND EMAIL VERIFICATION
  // ==========================================================

  const resendEmailVerification = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error("No authenticated Firebase user found.");
    }

    await reload(firebaseUser);

    const currentFirebaseUser = auth.currentUser;

    if (!currentFirebaseUser) {
      throw new Error("Unable to load Firebase user.");
    }

    if (currentFirebaseUser.emailVerified) {
      return {
        success: true,
        message: "Your email is already verified.",
      };
    }

    await sendEmailVerification(currentFirebaseUser);

    return {
      success: true,
      message: "Verification email sent successfully.",
    };
  }, []);

  // ==========================================================
  // AUTH STATE OBSERVER
  //
  // IMPORTANT:
  //
  // Firebase authentication and application JWT are separate.
  //
  // We DO NOT automatically create /auth/jwt here.
  //
  // We only attempt to restore an existing application session
  // through GET /auth/me.
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

      try {
        // ----------------------------------------------------
        // NO FIREBASE USER
        // ----------------------------------------------------

        if (!firebaseUser) {
          setUser(null);
          return;
        }

        // ----------------------------------------------------
        // FIREBASE USER EXISTS
        //
        // Do not create JWT automatically.
        // Only check existing backend session.
        // ----------------------------------------------------

        try {
          const databaseUser = await getCurrentUser();

          if (mounted) {
            setUser(databaseUser);
          }
        } catch (error) {
          // A missing/expired backend cookie is normal in some
          // situations. Firebase state can still exist separately.

          if (mounted) {
            setUser(null);
          }

          console.warn(
            "AUTH SESSION RESTORE:",
            error?.response?.data?.message ||
              error?.message ||
              "No active application session.",
          );
        }
      } catch (error) {
        console.error("AUTH STATE ERROR:", error?.message || error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [getCurrentUser]);

  // ==========================================================
  // AUTH CONTEXT VALUE
  // ==========================================================

  const authInfo = useMemo(
    () => ({
      // --------------------------------------------------------
      // STATE
      // --------------------------------------------------------

      user,
      loading,

      // --------------------------------------------------------
      // REGISTER
      // --------------------------------------------------------

      createUser,

      // --------------------------------------------------------
      // LOGIN
      // --------------------------------------------------------

      signInUser,
      signInWithGoogle,

      // --------------------------------------------------------
      // LOGOUT
      // --------------------------------------------------------

      logOutUser,

      // --------------------------------------------------------
      // EMAIL VERIFICATION
      // --------------------------------------------------------

      resendEmailVerification,

      // --------------------------------------------------------
      // CURRENT USER
      // --------------------------------------------------------

      getCurrentUser,
    }),
    [
      user,
      loading,
      createUser,
      signInUser,
      signInWithGoogle,
      logOutUser,
      resendEmailVerification,
      getCurrentUser,
    ],
  );

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
