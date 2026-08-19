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

import { auth } from "./firebase.config";

import axios from "axios";

// ============================================================
// AUTH CONTEXT
// ============================================================

export const AuthContext = createContext(null);

// ============================================================
// API
// ============================================================

// Change this only if your project uses another API URL.

const API = import.meta.env.VITE_API_URL;

// ============================================================
// GOOGLE PROVIDER
// ============================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ============================================================
// AXIOS INSTANCE
// ============================================================

const api = axios.create({
  baseURL: API,
  withCredentials: true,
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
  // FIREBASE ID TOKEN
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
  // SYNC USER TO MONGODB
  //
  // POST /users
  //
  // Firebase
  //    ↓
  // Firebase ID Token
  //    ↓
  // verifyFirebaseToken
  //    ↓
  // MongoDB usersCollection
  // ==========================================================

  const syncUserToDatabase = useCallback(
    async (firebaseUser, additionalData = {}) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is unavailable.");
      }

      const token = await getFirebaseIdToken(firebaseUser);

      const payload = {
        name: additionalData?.name || firebaseUser.displayName || "",

        photo: additionalData?.photo || firebaseUser.photoURL || "",
      };

      const response = await api.post("/users", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to synchronize user account.",
        );
      }

      return response.data;
    },
    [getFirebaseIdToken],
  );

  // ==========================================================
  // CREATE APPLICATION JWT
  //
  // POST /auth/jwt
  //
  // Firebase ID Token
  //       ↓
  // verifyFirebaseToken
  //       ↓
  // MongoDB user
  //       ↓
  // Application JWT
  //       ↓
  // HTTP-only cookie
  // ==========================================================

  const createApplicationSession = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is unavailable.");
      }

      const token = await getFirebaseIdToken(firebaseUser);

      const response = await api.post(
        "/auth/jwt",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response?.data?.success) {
        const error = new Error(
          response?.data?.message || "Failed to create application session.",
        );

        error.code = response?.data?.code || "";

        throw error;
      }

      return response.data;
    },
    [getFirebaseIdToken],
  );

  // ==========================================================
  // GET CURRENT DATABASE USER
  //
  // GET /auth/me
  //
  // Application JWT cookie
  //       ↓
  // verifyToken
  //       ↓
  // verifyUser
  //       ↓
  // MongoDB user
  // ==========================================================

  const getCurrentUser = useCallback(async () => {
    const response = await api.get("/auth/me");

    if (!response?.data?.success) {
      throw new Error(
        response?.data?.message || "Failed to load authenticated user.",
      );
    }

    return response.data.user;
  }, []);

  // ==========================================================
  // REGISTER USER
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

      // ======================================================
      // CREATE FIREBASE ACCOUNT
      // ======================================================

      const result = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      const firebaseUser = result.user;

      if (!firebaseUser) {
        throw new Error("Failed to create Firebase account.");
      }

      // ======================================================
      // UPDATE FIREBASE PROFILE
      // ======================================================

      const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        cleanName,
      )}&size=256`;

      const finalPhoto = cleanPhoto || fallbackPhoto;

      await updateProfile(firebaseUser, {
        displayName: cleanName,
        photoURL: finalPhoto,
      });

      // ======================================================
      // RELOAD FIREBASE USER
      // ======================================================

      await reload(firebaseUser);

      const currentFirebaseUser = auth.currentUser;

      if (!currentFirebaseUser) {
        throw new Error("Unable to load newly created Firebase user.");
      }

      // ======================================================
      // SAVE USER TO MONGODB
      //
      // POST /users
      // ======================================================

      await syncUserToDatabase(currentFirebaseUser, {
        name: cleanName,
        photo: finalPhoto,
      });

      // ======================================================
      // SEND EMAIL VERIFICATION
      // ======================================================

      if (!currentFirebaseUser.emailVerified) {
        await sendEmailVerification(currentFirebaseUser);
      }

      // ======================================================
      // IMPORTANT
      //
      // DO NOT CREATE /auth/jwt HERE.
      //
      // Registration should NOT automatically create the
      // application login session.
      // ======================================================

      setUser(null);

      return {
        success: true,
        firebaseUser: currentFirebaseUser,
        message:
          "Registration successful! Please verify your email before logging in.",
      };
    },
    [syncUserToDatabase],
  );

  // ==========================================================
  // LOGIN WITH EMAIL/PASSWORD
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

      // ======================================================
      // FIREBASE LOGIN
      // ======================================================

      const result = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      const firebaseUser = result.user;

      if (!firebaseUser) {
        throw new Error("Login failed.");
      }

      // ======================================================
      // EMAIL VERIFICATION
      // ======================================================

      await reload(firebaseUser);

      const currentFirebaseUser = auth.currentUser;

      if (!currentFirebaseUser) {
        throw new Error("Authenticated Firebase user not found.");
      }

      if (!currentFirebaseUser.emailVerified) {
        await signOut(auth);

        const error = new Error(
          "Please verify your email address before logging in.",
        );

        error.code = "auth/email-not-verified";

        throw error;
      }

      // ======================================================
      // SYNC USER
      //
      // Useful if profile information changed in Firebase.
      // ======================================================

      await syncUserToDatabase(currentFirebaseUser);

      // ======================================================
      // CREATE APPLICATION JWT
      //
      // POST /auth/jwt
      // ======================================================

      const session = await createApplicationSession(currentFirebaseUser);

      // ======================================================
      // GET DATABASE USER
      // ======================================================

      const databaseUser = session?.user || (await getCurrentUser());

      setUser(databaseUser);

      return {
        success: true,
        user: databaseUser,
        message: "Login successful.",
      };
    },
    [syncUserToDatabase, createApplicationSession, getCurrentUser],
  );

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const signInWithGoogle = useCallback(async () => {
    // ========================================================
    // FIREBASE GOOGLE LOGIN
    // ========================================================

    const result = await signInWithPopup(auth, googleProvider);

    const firebaseUser = result.user;

    if (!firebaseUser) {
      throw new Error("Google authentication failed.");
    }

    // ========================================================
    // SAVE / SYNC USER TO MONGODB
    //
    // POST /users
    // ========================================================

    await syncUserToDatabase(firebaseUser);

    // ========================================================
    // CREATE APPLICATION JWT
    //
    // POST /auth/jwt
    // ========================================================

    const session = await createApplicationSession(firebaseUser);

    // ========================================================
    // GET DATABASE USER
    // ========================================================

    const databaseUser = session?.user || (await getCurrentUser());

    setUser(databaseUser);

    return {
      success: true,
      user: databaseUser,
      message: "Google login successful.",
    };
  }, [syncUserToDatabase, createApplicationSession, getCurrentUser]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logOutUser = useCallback(async () => {
    try {
      // ======================================================
      // REMOVE APPLICATION JWT COOKIE
      // ======================================================

      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "Backend logout error:",
        error?.response?.data || error?.message || error,
      );
    } finally {
      // ======================================================
      // SIGN OUT FROM FIREBASE
      // ======================================================

      await signOut(auth);

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

    await sendEmailVerification(firebaseUser);

    return {
      success: true,
      message: "Verification email sent successfully.",
    };
  }, []);

  // ==========================================================
  // AUTH STATE OBSERVER
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!mounted) {
          return;
        }

        // ==================================================
        // NO FIREBASE USER
        // ==================================================

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);

          return;
        }

        // ==================================================
        // IMPORTANT:
        //
        // A newly registered but unverified password user
        // should NOT become an application-authenticated user.
        // ==================================================

        await reload(firebaseUser);

        if (
          firebaseUser.providerData?.some(
            (provider) => provider.providerId === "password",
          ) &&
          !firebaseUser.emailVerified
        ) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }

          return;
        }

        // ==================================================
        // TRY TO RESTORE APPLICATION SESSION
        // ==================================================

        try {
          const databaseUser = await getCurrentUser();

          if (mounted) {
            setUser(databaseUser);
          }
        } catch (error) {
          console.error(
            "AUTH STATE: Failed to restore application session:",
            error?.response?.data || error?.message || error,
          );

          // =================================================
          // Firebase may still be signed in while the
          // application JWT cookie is missing/expired.
          //
          // Do not automatically create a new JWT here.
          // Login should explicitly create the session.
          // =================================================

          if (mounted) {
            setUser(null);
          }
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
      user,
      loading,

      createUser,
      signInUser,
      signInWithGoogle,
      logOutUser,

      resendEmailVerification,

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
