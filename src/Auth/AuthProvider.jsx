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
// API CONFIG
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  JWT: "/auth/jwt",
  ME: "/auth/me",
  PROFILE: "/auth/profile",
  LOGOUT: "/auth/logout",
};

const REQUEST_TIMEOUT = 15000;

// ============================================================
// AXIOS INSTANCE
// ============================================================

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

if (!API_URL) {
  console.warn(
    "VITE_API_URL is not configured. Authentication API requests will fail.",
  );
}

// ============================================================
// GOOGLE PROVIDER
// ============================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ============================================================
// HELPERS
// ============================================================

const normalizeString = (value = "") => {
  return typeof value === "string" ? value.trim() : "";
};

const normalizeEmail = (value = "") => {
  return normalizeString(value).toLowerCase();
};

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return error?.response?.data?.message || error?.message || fallback;
};

const createAuthError = (message, code = "", response = null) => {
  const error = new Error(message);

  error.code = code;
  error.response = response;

  return error;
};

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

  const authOperationRef = useRef(false);
  const mountedRef = useRef(true);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const role = user?.role || "user";
  const status = user?.status || "active";

  // ==========================================================
  // FIREBASE TOKEN
  // ==========================================================

  const getFirebaseIdToken = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      throw new Error("Firebase user is unavailable.");
    }

    const token = await firebaseUser.getIdToken();

    if (!token) {
      throw new Error("Unable to get Firebase ID token.");
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
  // REGISTER / SYNC USER
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
          ? normalizeString(additionalData.name)
          : normalizeString(firebaseUser.displayName);

      const photo =
        typeof additionalData.photo === "string"
          ? normalizeString(additionalData.photo)
          : normalizeString(firebaseUser.photoURL);

      try {
        const response = await api.post(
          AUTH_ENDPOINTS.REGISTER,
          {
            name,
            photo,
          },
          config,
        );

        if (!response?.data?.success) {
          throw createAuthError(
            response?.data?.message || "Failed to synchronize user account.",
            response?.data?.code || "",
            response,
          );
        }

        return response.data;
      } catch (error) {
        console.error(
          "REGISTER USER DATABASE ERROR:",
          error?.response?.data || error?.message || error,
        );

        throw error;
      }
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

      try {
        const response = await api.post(AUTH_ENDPOINTS.JWT, {}, config);

        if (!response?.data?.success) {
          throw createAuthError(
            response?.data?.message || "Failed to create application session.",
            response?.data?.code || "",
            response,
          );
        }

        return response.data;
      } catch (error) {
        console.error(
          "CREATE APPLICATION SESSION ERROR:",
          error?.response?.data || error?.message || error,
        );

        throw error;
      }
    },
    [getFirebaseAuthConfig],
  );

  // ==========================================================
  // GET CURRENT USER
  // GET /auth/me
  // ==========================================================

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await api.get(AUTH_ENDPOINTS.ME);

      if (!response?.data?.success || !response?.data?.user) {
        throw createAuthError(
          response?.data?.message || "Authenticated user could not be loaded.",
          response?.data?.code || "",
          response,
        );
      }

      return response.data.user;
    } catch (error) {
      throw error;
    }
  }, []);

  // ==========================================================
  // CLEANUP AUTHENTICATION
  // ==========================================================

  const cleanupAuthentication = useCallback(async () => {
    // --------------------------------------------------------
    // Clear backend JWT cookie
    // --------------------------------------------------------

    try {
      await api.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn(
        "BACKEND SESSION CLEANUP:",
        error?.response?.data?.message || error?.message || error,
      );
    }

    // --------------------------------------------------------
    // Clear Firebase session
    // --------------------------------------------------------

    try {
      await signOut(auth);
    } catch (error) {
      console.warn("FIREBASE SESSION CLEANUP:", error?.message || error);
    }

    if (mountedRef.current) {
      setUser(null);
    }
  }, []);

  // ==========================================================
  // UPDATE USER PROFILE
  //
  // Firebase:
  // updateProfile()
  //
  // Backend:
  // PATCH /auth/profile
  // ==========================================================

  const updateUserProfile = useCallback(
    async (name, photo = "") => {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("No authenticated Firebase user found.");
      }

      const cleanName = normalizeString(name);
      const cleanPhoto = normalizeString(photo);

      // ------------------------------------------------------
      // Validate name
      // ------------------------------------------------------

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      if (cleanName.length < 2) {
        throw new Error("Name must contain at least 2 characters.");
      }

      if (cleanName.length > 100) {
        throw new Error("Name cannot exceed 100 characters.");
      }

      // ------------------------------------------------------
      // Validate photo
      // ------------------------------------------------------

      if (cleanPhoto) {
        try {
          const photoUrl = new URL(cleanPhoto);

          if (photoUrl.protocol !== "http:" && photoUrl.protocol !== "https:") {
            throw new Error("Invalid photo URL.");
          }
        } catch {
          throw new Error("Please provide a valid HTTP or HTTPS photo URL.");
        }
      }

      // ------------------------------------------------------
      // Save previous Firebase values
      // ------------------------------------------------------

      const previousName = firebaseUser.displayName || "";

      const previousPhoto = firebaseUser.photoURL || "";

      try {
        // ----------------------------------------------------
        // 1. Update Firebase
        // ----------------------------------------------------

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: cleanPhoto || null,
        });

        // ----------------------------------------------------
        // 2. Reload Firebase user
        // ----------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to reload Firebase user.");
        }

        // ----------------------------------------------------
        // 3. Firebase ID token
        // ----------------------------------------------------

        const config = await getFirebaseAuthConfig(currentFirebaseUser);

        // ----------------------------------------------------
        // 4. Update MongoDB
        // ----------------------------------------------------

        const response = await api.patch(
          AUTH_ENDPOINTS.PROFILE,
          {
            name: cleanName,
            photo: cleanPhoto,
          },
          config,
        );

        if (!response?.data?.success) {
          throw createAuthError(
            response?.data?.message || "Failed to update your profile.",
            response?.data?.code || "",
            response,
          );
        }

        // ----------------------------------------------------
        // 5. Resolve updated user
        // ----------------------------------------------------

        const updatedUser = response?.data?.user || (await getCurrentUser());

        if (!updatedUser) {
          throw new Error(
            "Profile updated, but user data could not be loaded.",
          );
        }

        // ----------------------------------------------------
        // 6. Update React state
        // ----------------------------------------------------

        if (mountedRef.current) {
          setUser(updatedUser);
        }

        return {
          success: true,
          user: updatedUser,
          firebaseUser: currentFirebaseUser,
          message: response?.data?.message || "Profile updated successfully.",
        };
      } catch (error) {
        // ----------------------------------------------------
        // Rollback Firebase if MongoDB update fails
        // ----------------------------------------------------

        try {
          const currentFirebaseUser = auth.currentUser;

          if (currentFirebaseUser) {
            await updateProfile(currentFirebaseUser, {
              displayName: previousName,
              photoURL: previousPhoto || null,
            });

            await reload(currentFirebaseUser);
          }
        } catch (rollbackError) {
          console.warn(
            "FIREBASE PROFILE ROLLBACK FAILED:",
            rollbackError?.message || rollbackError,
          );
        }

        console.error(
          "UPDATE PROFILE ERROR:",
          error?.response?.data || error?.message || error,
        );

        throw error;
      }
    },
    [getFirebaseAuthConfig, getCurrentUser],
  );

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const createUser = useCallback(
    async (email, password, name, photoURL = "") => {
      const cleanEmail = normalizeEmail(email);
      const cleanPassword = typeof password === "string" ? password : "";

      const cleanName = normalizeString(name);
      const cleanPhoto = normalizeString(photoURL);

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!cleanPassword) {
        throw new Error("Password is required.");
      }

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      if (cleanName.length < 2) {
        throw new Error("Name must contain at least 2 characters.");
      }

      if (cleanName.length > 100) {
        throw new Error("Name cannot exceed 100 characters.");
      }

      if (authOperationRef.current) {
        throw new Error("Another authentication operation is already running.");
      }

      authOperationRef.current = true;

      try {
        // ----------------------------------------------------
        // 1. Firebase account
        // ----------------------------------------------------

        const result = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        const firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Failed to create Firebase account.");
        }

        // ----------------------------------------------------
        // 2. Profile photo
        // ----------------------------------------------------

        const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          cleanName,
        )}&size=256`;

        const finalPhoto = cleanPhoto || fallbackPhoto;

        // ----------------------------------------------------
        // 3. Firebase profile
        // ----------------------------------------------------

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: finalPhoto,
        });

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to load newly created Firebase user.");
        }

        // ----------------------------------------------------
        // 4. MongoDB
        // ----------------------------------------------------

        const registerResponse = await registerUserInDatabase(
          currentFirebaseUser,
          {
            name: cleanName,
            photo: finalPhoto,
          },
        );

        // ----------------------------------------------------
        // 5. Application JWT
        // ----------------------------------------------------

        const sessionResponse =
          await createApplicationSession(currentFirebaseUser);

        // ----------------------------------------------------
        // 6. Resolve database user
        // ----------------------------------------------------

        const databaseUser =
          sessionResponse?.user ||
          registerResponse?.user ||
          (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your user account.");
        }

        // ----------------------------------------------------
        // 7. Account status
        // ----------------------------------------------------

        if (databaseUser.status === "blocked") {
          throw new Error("Your account has been blocked.");
        }

        if (databaseUser.status && databaseUser.status !== "active") {
          throw new Error("Your account is not active.");
        }

        // ----------------------------------------------------
        // 8. Email verification
        // ----------------------------------------------------

        let verificationSent = false;

        if (!currentFirebaseUser.emailVerified) {
          try {
            await sendEmailVerification(currentFirebaseUser);

            verificationSent = true;
          } catch (verificationError) {
            console.warn(
              "EMAIL VERIFICATION ERROR:",
              verificationError?.message || verificationError,
            );
          }
        }

        // ----------------------------------------------------
        // 9. React state
        // ----------------------------------------------------

        if (mountedRef.current) {
          setUser(databaseUser);
        }

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

        await cleanupAuthentication();

        throw error;
      } finally {
        authOperationRef.current = false;
      }
    },
    [
      registerUserInDatabase,
      createApplicationSession,
      getCurrentUser,
      cleanupAuthentication,
    ],
  );

  // ==========================================================
  // EMAIL / PASSWORD LOGIN
  // ==========================================================

  const loginUser = useCallback(
    async (email, password) => {
      const cleanEmail = normalizeEmail(email);
      const cleanPassword = typeof password === "string" ? password : "";

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!cleanPassword) {
        throw new Error("Password is required.");
      }

      if (authOperationRef.current) {
        throw new Error("Another authentication operation is already running.");
      }

      authOperationRef.current = true;

      try {
        // ----------------------------------------------------
        // 1. Firebase login
        // ----------------------------------------------------

        const result = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        const firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Login failed.");
        }

        // ----------------------------------------------------
        // 2. Reload
        // ----------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Authenticated Firebase user could not be loaded.");
        }

        // ----------------------------------------------------
        // 3. MongoDB synchronization
        // ----------------------------------------------------

        const registerResponse =
          await registerUserInDatabase(currentFirebaseUser);

        // ----------------------------------------------------
        // 4. Application session
        // ----------------------------------------------------

        const sessionResponse =
          await createApplicationSession(currentFirebaseUser);

        // ----------------------------------------------------
        // 5. Database user
        // ----------------------------------------------------

        const databaseUser =
          sessionResponse?.user ||
          registerResponse?.user ||
          (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your user account.");
        }

        // ----------------------------------------------------
        // 6. Account status
        // ----------------------------------------------------

        if (databaseUser.status === "blocked") {
          throw new Error("Your account has been blocked.");
        }

        if (databaseUser.status && databaseUser.status !== "active") {
          throw new Error("Your account is not active.");
        }

        // ----------------------------------------------------
        // 7. React state
        // ----------------------------------------------------

        if (mountedRef.current) {
          setUser(databaseUser);
        }

        return {
          success: true,
          user: databaseUser,
          firebaseUser: currentFirebaseUser,
          emailVerified: currentFirebaseUser.emailVerified,
          message: "Login successful.",
        };
      } catch (error) {
        console.error(
          "LOGIN ERROR:",
          error?.response?.data || error?.message || error,
        );

        await cleanupAuthentication();

        throw error;
      } finally {
        authOperationRef.current = false;
      }
    },
    [
      registerUserInDatabase,
      createApplicationSession,
      getCurrentUser,
      cleanupAuthentication,
    ],
  );

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const signInWithGoogle = useCallback(async () => {
    if (authOperationRef.current) {
      throw new Error("Another authentication operation is already running.");
    }

    authOperationRef.current = true;

    try {
      // ----------------------------------------------------
      // 1. Google authentication
      // ----------------------------------------------------

      const result = await signInWithPopup(auth, googleProvider);

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Google authentication failed.");
      }

      // ----------------------------------------------------
      // 2. Reload
      // ----------------------------------------------------

      await reload(firebaseUser);

      const currentFirebaseUser = auth.currentUser;

      if (!currentFirebaseUser) {
        throw new Error("Unable to load Google Firebase user.");
      }

      // ----------------------------------------------------
      // 3. MongoDB
      // ----------------------------------------------------

      const registerResponse = await registerUserInDatabase(
        currentFirebaseUser,
        {
          name: currentFirebaseUser.displayName || "",
          photo: currentFirebaseUser.photoURL || "",
        },
      );

      // ----------------------------------------------------
      // 4. Application JWT
      // ----------------------------------------------------

      const sessionResponse =
        await createApplicationSession(currentFirebaseUser);

      // ----------------------------------------------------
      // 5. Resolve database user
      // ----------------------------------------------------

      const databaseUser =
        sessionResponse?.user ||
        registerResponse?.user ||
        (await getCurrentUser());

      if (!databaseUser) {
        throw new Error("Unable to load Google user account.");
      }

      // ----------------------------------------------------
      // 6. Account status
      // ----------------------------------------------------

      if (databaseUser.status === "blocked") {
        throw new Error("Your account has been blocked.");
      }

      if (databaseUser.status && databaseUser.status !== "active") {
        throw new Error("Your account is not active.");
      }

      // ----------------------------------------------------
      // 7. React state
      // ----------------------------------------------------

      if (mountedRef.current) {
        setUser(databaseUser);
      }

      return {
        success: true,
        user: databaseUser,
        firebaseUser: currentFirebaseUser,
        message: "Google login successful.",
      };
    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      await cleanupAuthentication();

      throw error;
    } finally {
      authOperationRef.current = false;
    }
  }, [
    registerUserInDatabase,
    createApplicationSession,
    getCurrentUser,
    cleanupAuthentication,
  ]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logOutUser = useCallback(async () => {
    if (authOperationRef.current) {
      return;
    }

    authOperationRef.current = true;

    try {
      // ----------------------------------------------------
      // Backend logout
      // ----------------------------------------------------

      try {
        await api.post(AUTH_ENDPOINTS.LOGOUT);
      } catch (error) {
        console.warn(
          "BACKEND LOGOUT ERROR:",
          error?.response?.data?.message || error?.message || error,
        );
      }

      // ----------------------------------------------------
      // Firebase logout
      // ----------------------------------------------------

      try {
        await signOut(auth);
      } catch (error) {
        console.warn("FIREBASE LOGOUT ERROR:", error?.message || error);
      }

      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      authOperationRef.current = false;
    }
  }, []);

  // Compatibility alias
  const signOutUser = logOutUser;

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
        verified: true,
        message: "Your email is already verified.",
      };
    }

    await sendEmailVerification(currentFirebaseUser);

    return {
      success: true,
      verified: false,
      message: "Verification email sent successfully.",
    };
  }, []);

  // ==========================================================
  // REFRESH USER
  // GET /auth/me
  // ==========================================================

  const refreshUser = useCallback(async () => {
    try {
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        await reload(firebaseUser);
      }

      const databaseUser = await getCurrentUser();

      if (!databaseUser) {
        throw new Error("Authenticated user was not found.");
      }

      if (mountedRef.current) {
        setUser(databaseUser);
      }

      return databaseUser;
    } catch (error) {
      console.error(
        "REFRESH USER ERROR:",
        error?.response?.data || error?.message || error,
      );

      throw error;
    }
  }, [getCurrentUser]);

  // ==========================================================
  // CLEAR USER
  // ==========================================================

  const clearUser = useCallback(() => {
    if (mountedRef.current) {
      setUser(null);
    }
  }, []);

  // ==========================================================
  // AUTH STATE OBSERVER
  //
  // Purpose:
  // Restore an existing backend JWT session.
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mountedRef.current) {
        return;
      }

      // Login/register functions handle their own state.
      if (authOperationRef.current) {
        return;
      }

      try {
        // ------------------------------------------------
        // No Firebase user
        // ------------------------------------------------

        if (!firebaseUser) {
          if (mountedRef.current) {
            setUser(null);
          }

          return;
        }

        // ------------------------------------------------
        // Existing Firebase session
        //
        // Backend JWT cookie should restore the user.
        // ------------------------------------------------

        try {
          const databaseUser = await getCurrentUser();

          if (mountedRef.current && databaseUser) {
            setUser(databaseUser);
          }
        } catch (error) {
          console.warn(
            "AUTH SESSION RESTORE:",
            error?.response?.data?.message ||
              error?.message ||
              "No active application session.",
          );

          if (mountedRef.current) {
            setUser(null);
          }
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
      // ------------------------------------------------------
      // State
      // ------------------------------------------------------

      user,
      loading,

      // ------------------------------------------------------
      // Role / status
      // ------------------------------------------------------

      role,
      status,

      // ------------------------------------------------------
      // Authentication
      // ------------------------------------------------------

      createUser,
      loginUser,
      signInWithGoogle,

      logOutUser,
      signOutUser,

      // Compatibility
      signInUser: loginUser,

      // ------------------------------------------------------
      // Profile
      // ------------------------------------------------------

      updateUserProfile,
      refreshUser,

      // ------------------------------------------------------
      // Email verification
      // ------------------------------------------------------

      resendEmailVerification,

      // ------------------------------------------------------
      // User
      // ------------------------------------------------------

      getCurrentUser,

      // ------------------------------------------------------
      // Utility
      // ------------------------------------------------------

      clearUser,
    }),
    [
      user,
      loading,
      role,
      status,
      createUser,
      loginUser,
      signInWithGoogle,
      logOutUser,
      signOutUser,
      updateUserProfile,
      refreshUser,
      resendEmailVerification,
      getCurrentUser,
      clearUser,
    ],
  );

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

// ============================================================
// EXPORT
// ============================================================

export default AuthProvider;
