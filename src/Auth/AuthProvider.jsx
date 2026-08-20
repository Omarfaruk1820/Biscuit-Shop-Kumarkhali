import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  // REFS
  // ==========================================================

  const authFlowRef = useRef(false);
  const mountedRef = useRef(true);

  // ==========================================================
  // GET FIREBASE ID TOKEN
  // ==========================================================

  const getFirebaseIdToken = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      throw new Error("Firebase user is unavailable.");
    }

    const token = await firebaseUser.getIdToken(true);

    if (!token) {
      throw new Error("Unable to get Firebase authentication token.");
    }

    return token;
  }, []);

  // ==========================================================
  // FIREBASE AUTH CONFIG
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
  // REGISTER USER IN MONGODB
  // POST /auth/register
  // ==========================================================

  const registerUserInDatabase = useCallback(
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

        error.code = response?.data?.code || "";
        error.response = response;

        throw error;
      }

      return response.data;
    },
    [getFirebaseAuthConfig],
  );

  // ==========================================================
  // CREATE APPLICATION SESSION
  // POST /auth/jwt
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
  // GET CURRENT USER
  // GET /auth/me
  // ==========================================================

  const getCurrentUser = useCallback(async () => {
    const response = await api.get("/auth/me");

    if (!response?.data?.success || !response?.data?.user) {
      const error = new Error(
        response?.data?.message || "Failed to load authenticated user.",
      );

      error.code = response?.data?.code || "";
      error.response = response;

      throw error;
    }

    return response.data.user;
  }, []);

  // ==========================================================
  // REGISTER
  //
  // REGISTER
  //    ↓
  // FIREBASE
  //    ↓
  // MONGODB
  //    ↓
  // JWT COOKIE
  //    ↓
  // SET USER
  //    ↓
  // VERIFICATION EMAIL
  //    ↓
  // HOME
  // ==========================================================

  const createUser = useCallback(
    async (email, password, name, photoURL = "") => {
      const cleanEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      const cleanPassword = typeof password === "string" ? password : "";

      const cleanName = typeof name === "string" ? name.trim() : "";

      const cleanPhoto = typeof photoURL === "string" ? photoURL.trim() : "";

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!cleanPassword) {
        throw new Error("Password is required.");
      }

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      if (authFlowRef.current) {
        throw new Error("Another authentication operation is already running.");
      }

      authFlowRef.current = true;

      try {
        // ------------------------------------------------------
        // 1. CREATE FIREBASE ACCOUNT
        // ------------------------------------------------------

        const result = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        const firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Failed to create Firebase account.");
        }

        // ------------------------------------------------------
        // 2. PROFILE PHOTO
        // ------------------------------------------------------

        const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          cleanName,
        )}&size=256`;

        const finalPhoto = cleanPhoto || fallbackPhoto;

        // ------------------------------------------------------
        // 3. UPDATE FIREBASE PROFILE
        // ------------------------------------------------------

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: finalPhoto,
        });

        // ------------------------------------------------------
        // 4. RELOAD FIREBASE USER
        // ------------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to load newly created Firebase user.");
        }

        // ------------------------------------------------------
        // 5. CREATE MONGODB USER
        // ------------------------------------------------------

        const registerResponse = await registerUserInDatabase(
          currentFirebaseUser,
          {
            name: cleanName,
            photo: finalPhoto,
          },
        );

        // ------------------------------------------------------
        // 6. CREATE JWT SESSION
        //
        // IMPORTANT:
        // Your server does NOT reject unverified users here.
        // ------------------------------------------------------

        const sessionResponse =
          await createApplicationSession(currentFirebaseUser);

        // ------------------------------------------------------
        // 7. GET APPLICATION USER
        // ------------------------------------------------------

        const databaseUser =
          sessionResponse?.user ||
          registerResponse?.user ||
          (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your newly created user account.");
        }

        // ------------------------------------------------------
        // 8. SEND EMAIL VERIFICATION
        //
        // IMPORTANT:
        // This happens AFTER JWT creation.
        // User remains logged in.
        // ------------------------------------------------------

        let verificationSent = false;

        if (!currentFirebaseUser.emailVerified) {
          try {
            await sendEmailVerification(currentFirebaseUser);

            verificationSent = true;
          } catch (error) {
            console.warn("EMAIL VERIFICATION ERROR:", error?.message || error);
          }
        }

        // ------------------------------------------------------
        // 9. SAVE USER TO CONTEXT
        // ------------------------------------------------------

        if (mountedRef.current) {
          setUser(databaseUser);
        }

        // ------------------------------------------------------
        // 10. SUCCESS
        // ------------------------------------------------------

        return {
          success: true,
          user: databaseUser,
          firebaseUser: currentFirebaseUser,
          verificationSent,
          message: "Registration successful. You are now logged in.",
        };
      } catch (error) {
        console.error(
          "REGISTER ERROR:",
          error?.response?.data || error?.message || error,
        );

        // ------------------------------------------------------
        // CLEAR SERVER COOKIE
        // ------------------------------------------------------

        try {
          await api.post("/auth/logout");
        } catch (logoutError) {
          console.warn(
            "REGISTER SESSION CLEANUP ERROR:",
            logoutError?.message || logoutError,
          );
        }

        // ------------------------------------------------------
        // CLEAR FIREBASE SESSION
        // ------------------------------------------------------

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.warn(
            "REGISTER FIREBASE CLEANUP ERROR:",
            signOutError?.message || signOutError,
          );
        }

        if (mountedRef.current) {
          setUser(null);
        }

        throw error;
      } finally {
        authFlowRef.current = false;
      }
    },
    [registerUserInDatabase, createApplicationSession, getCurrentUser],
  );

  // ==========================================================
  // LOGIN
  // ==========================================================

  const loginUser = useCallback(
    async (email, password) => {
      const cleanEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      if (authFlowRef.current) {
        throw new Error("Another authentication operation is already running.");
      }

      authFlowRef.current = true;

      try {
        // ------------------------------------------------------
        // 1. FIREBASE LOGIN
        // ------------------------------------------------------

        const result = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );

        const firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Login failed.");
        }

        // ------------------------------------------------------
        // 2. RELOAD
        // ------------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Authenticated Firebase user could not be loaded.");
        }

        // ------------------------------------------------------
        // 3. EMAIL VERIFICATION
        // ------------------------------------------------------

        if (!currentFirebaseUser.emailVerified) {
          const error = new Error(
            "Please verify your email address before logging in.",
          );

          error.code = "auth/email-not-verified";

          throw error;
        }

        // ------------------------------------------------------
        // 4. SYNC DATABASE
        // ------------------------------------------------------

        await registerUserInDatabase(currentFirebaseUser);

        // ------------------------------------------------------
        // 5. CREATE JWT
        // ------------------------------------------------------

        const sessionResponse =
          await createApplicationSession(currentFirebaseUser);

        // ------------------------------------------------------
        // 6. GET USER
        // ------------------------------------------------------

        const databaseUser = sessionResponse?.user || (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your user account.");
        }

        // ------------------------------------------------------
        // 7. SAVE USER
        // ------------------------------------------------------

        if (mountedRef.current) {
          setUser(databaseUser);
        }

        return {
          success: true,
          user: databaseUser,
          message: "Login successful.",
        };
      } catch (error) {
        console.error(
          "LOGIN ERROR:",
          error?.response?.data || error?.message || error,
        );

        try {
          await api.post("/auth/logout");
        } catch (logoutError) {
          console.warn(
            "LOGIN SESSION CLEANUP ERROR:",
            logoutError?.message || logoutError,
          );
        }

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.warn(
            "LOGIN FIREBASE CLEANUP ERROR:",
            signOutError?.message || signOutError,
          );
        }

        if (mountedRef.current) {
          setUser(null);
        }

        throw error;
      } finally {
        authFlowRef.current = false;
      }
    },
    [registerUserInDatabase, createApplicationSession, getCurrentUser],
  );

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const signInWithGoogle = useCallback(async () => {
    if (authFlowRef.current) {
      throw new Error("Another authentication operation is already running.");
    }

    authFlowRef.current = true;

    try {
      // ------------------------------------------------------
      // 1. GOOGLE LOGIN
      // ------------------------------------------------------

      const result = await signInWithPopup(auth, googleProvider);

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Google authentication failed.");
      }

      // ------------------------------------------------------
      // 2. SYNC USER
      // ------------------------------------------------------

      const registerResponse = await registerUserInDatabase(firebaseUser, {
        name: firebaseUser.displayName || "",
        photo: firebaseUser.photoURL || "",
      });

      // ------------------------------------------------------
      // 3. CREATE JWT
      // ------------------------------------------------------

      const sessionResponse = await createApplicationSession(firebaseUser);

      // ------------------------------------------------------
      // 4. GET USER
      // ------------------------------------------------------

      const databaseUser =
        sessionResponse?.user ||
        registerResponse?.user ||
        (await getCurrentUser());

      if (!databaseUser) {
        throw new Error("Unable to load Google user account.");
      }

      // ------------------------------------------------------
      // 5. SAVE USER
      // ------------------------------------------------------

      if (mountedRef.current) {
        setUser(databaseUser);
      }

      return {
        success: true,
        user: databaseUser,
        message: "Google login successful.",
      };
    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      try {
        await api.post("/auth/logout");
      } catch (logoutError) {
        console.warn(
          "GOOGLE SESSION CLEANUP ERROR:",
          logoutError?.message || logoutError,
        );
      }

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn(
          "GOOGLE FIREBASE CLEANUP ERROR:",
          signOutError?.message || signOutError,
        );
      }

      if (mountedRef.current) {
        setUser(null);
      }

      throw error;
    } finally {
      authFlowRef.current = false;
    }
  }, [registerUserInDatabase, createApplicationSession, getCurrentUser]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logOutUser = useCallback(async () => {
    if (authFlowRef.current) {
      return;
    }

    authFlowRef.current = true;

    try {
      // ------------------------------------------------------
      // BACKEND LOGOUT
      // ------------------------------------------------------

      try {
        await api.post("/auth/logout");
      } catch (error) {
        console.warn(
          "BACKEND LOGOUT ERROR:",
          error?.response?.data || error?.message || error,
        );
      }

      // ------------------------------------------------------
      // FIREBASE LOGOUT
      // ------------------------------------------------------

      try {
        await signOut(auth);
      } catch (error) {
        console.warn("FIREBASE LOGOUT ERROR:", error?.message || error);
      }

      // ------------------------------------------------------
      // CLEAR USER
      // ------------------------------------------------------

      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      authFlowRef.current = false;
    }
  }, []);

  // ==========================================================
  // RESEND VERIFICATION EMAIL
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
  // REFRESH USER
  // ==========================================================

  const refreshUser = useCallback(async () => {
    try {
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        await reload(firebaseUser);
      }

      const databaseUser = await getCurrentUser();

      if (mountedRef.current) {
        setUser(databaseUser);
      }

      return databaseUser;
    } catch (error) {
      if (mountedRef.current) {
        setUser(null);
      }

      throw error;
    }
  }, [getCurrentUser]);

  // ==========================================================
  // AUTH STATE OBSERVER
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mountedRef.current) {
        return;
      }

      // ----------------------------------------------------
      // REGISTER / LOGIN / GOOGLE / LOGOUT IS RUNNING
      // ----------------------------------------------------

      if (authFlowRef.current) {
        return;
      }

      try {
        // --------------------------------------------------
        // NO FIREBASE USER
        // --------------------------------------------------

        if (!firebaseUser) {
          if (mountedRef.current) {
            setUser(null);
          }

          return;
        }

        // --------------------------------------------------
        // RESTORE APPLICATION SESSION
        // --------------------------------------------------

        try {
          const databaseUser = await getCurrentUser();

          if (mountedRef.current && databaseUser) {
            setUser(databaseUser);
          }
        } catch (error) {
          if (mountedRef.current) {
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

        if (mountedRef.current) {
          setUser(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
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

      loginUser,

      // Compatibility alias
      signInUser: loginUser,

      signInWithGoogle,

      logOutUser,

      resendEmailVerification,

      getCurrentUser,

      refreshUser,
    }),
    [
      user,
      loading,
      createUser,
      loginUser,
      signInWithGoogle,
      logOutUser,
      resendEmailVerification,
      getCurrentUser,
      refreshUser,
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
