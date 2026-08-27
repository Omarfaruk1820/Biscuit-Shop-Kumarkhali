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

import { auth } from "./firebase.config";
import axiosPublic from "../hooks/axiosPublic";

// ============================================================
// AUTH CONTEXT
// ============================================================

export const AuthContext = createContext(null);

// ============================================================
// CONFIG
// ============================================================

const REQUEST_TIMEOUT = 15000;

const ENDPOINTS = {
  REGISTER: "/auth/register",
  ME: "/auth/me",
  PROFILE: "/auth/profile",
  LOGOUT: "/auth/logout",
};

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

const normalizeString = (value = "") =>
  typeof value === "string" ? value.trim() : "";

const normalizeEmail = (value = "") => normalizeString(value).toLowerCase();

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
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

  const mountedRef = useRef(false);
  const operationRef = useRef(false);

  // ==========================================================
  // ROLE / STATUS
  // ==========================================================

  const role = user?.role || "user";
  const status = user?.status || "active";

  // ==========================================================
  // FIREBASE TOKEN
  // ==========================================================

  const getFirebaseToken = useCallback(
    async (firebaseUser, forceRefresh = false) => {
      if (!firebaseUser) {
        throw new Error("No authenticated Firebase user.");
      }

      const token = await firebaseUser.getIdToken(forceRefresh);

      if (!token) {
        throw new Error("Unable to obtain Firebase ID token.");
      }

      return token;
    },
    [],
  );

  // ==========================================================
  // GET DATABASE USER
  // ==========================================================

  const getCurrentUser = useCallback(
    async (firebaseUser = auth.currentUser, forceRefresh = false) => {
      if (!firebaseUser) {
        throw new Error("No authenticated Firebase user.");
      }

      const token = await getFirebaseToken(firebaseUser, forceRefresh);

      const response = await axiosPublic.get(ENDPOINTS.ME, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response?.data?.success || !response?.data?.user) {
        throw new Error(
          response?.data?.message || "Unable to load authenticated user.",
        );
      }

      return response.data.user;
    },
    [getFirebaseToken],
  );

  // ==========================================================
  // VALIDATE DATABASE USER
  // ==========================================================

  const validateDatabaseUser = useCallback((databaseUser) => {
    if (!databaseUser) {
      throw new Error("User account was not found.");
    }

    if (databaseUser.status === "blocked") {
      throw new Error("Your account has been blocked. Please contact support.");
    }

    if (databaseUser.status && databaseUser.status !== "active") {
      throw new Error("Your account is not active.");
    }

    return databaseUser;
  }, []);

  // ==========================================================
  // LOAD APPLICATION USER
  // ==========================================================

  const loadApplicationUser = useCallback(
    async (firebaseUser, forceRefresh = false) => {
      const databaseUser = await getCurrentUser(firebaseUser, forceRefresh);

      return validateDatabaseUser(databaseUser);
    },
    [getCurrentUser, validateDatabaseUser],
  );

  // ==========================================================
  // REGISTER USER IN DATABASE
  // ==========================================================

  const registerUserInDatabase = useCallback(
    async (firebaseUser, additionalData = {}) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is not available.");
      }

      const token = await getFirebaseToken(firebaseUser, true);

      const name =
        normalizeString(additionalData.name) ||
        normalizeString(firebaseUser.displayName) ||
        normalizeString(firebaseUser.email?.split("@")[0]) ||
        "User";

      const photo =
        normalizeString(additionalData.photo) ||
        normalizeString(firebaseUser.photoURL);

      const response = await axiosPublic.post(
        ENDPOINTS.REGISTER,
        {
          name,
          photo,
        },
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to create user account.",
        );
      }

      return response.data;
    },
    [getFirebaseToken],
  );

  // ==========================================================
  // BACKEND LOGOUT
  // ==========================================================

  const logoutBackend = useCallback(async () => {
    try {
      await axiosPublic.post(
        ENDPOINTS.LOGOUT,
        {},
        {
          timeout: REQUEST_TIMEOUT,
        },
      );
    } catch (error) {
      console.warn(
        "BACKEND LOGOUT:",
        getErrorMessage(error, "Backend logout request failed."),
      );
    }
  }, []);

  // ==========================================================
  // FIREBASE LOGOUT ONLY
  // ==========================================================

  const signOutFirebaseOnly = useCallback(async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.warn(
        "FIREBASE SIGN OUT:",
        getErrorMessage(error, "Firebase sign out failed."),
      );
    }

    if (mountedRef.current) {
      setUser(null);
    }
  }, []);

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const createUser = useCallback(
    async (email, password, name, photoURL = "") => {
      if (operationRef.current) {
        throw new Error("Another authentication operation is already running.");
      }

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

      operationRef.current = true;

      try {
        // ----------------------------------------------------
        // FIREBASE ACCOUNT
        // ----------------------------------------------------

        const result = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        let firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Firebase registration failed.");
        }

        // ----------------------------------------------------
        // DEFAULT PHOTO
        // ----------------------------------------------------

        const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          cleanName,
        )}&size=256`;

        const finalPhoto = cleanPhoto || fallbackPhoto;

        // ----------------------------------------------------
        // FIREBASE PROFILE
        // ----------------------------------------------------

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: finalPhoto,
        });

        await reload(firebaseUser);

        firebaseUser = auth.currentUser;

        if (!firebaseUser) {
          throw new Error("Unable to reload Firebase user.");
        }

        // ----------------------------------------------------
        // DATABASE USER
        // ----------------------------------------------------

        const registerResponse = await registerUserInDatabase(firebaseUser, {
          name: cleanName,
          photo: finalPhoto,
        });

        const databaseUser = validateDatabaseUser(registerResponse?.user);

        // ----------------------------------------------------
        // EMAIL VERIFICATION
        // ----------------------------------------------------

        let verificationSent = false;

        if (!firebaseUser.emailVerified) {
          try {
            await sendEmailVerification(firebaseUser);
            verificationSent = true;
          } catch (verificationError) {
            console.warn(
              "EMAIL VERIFICATION:",
              getErrorMessage(
                verificationError,
                "Verification email could not be sent.",
              ),
            );
          }
        }

        // ----------------------------------------------------
        // APPLICATION USER
        // ----------------------------------------------------

        if (mountedRef.current) {
          setUser(databaseUser);
        }

        return {
          success: true,
          user: databaseUser,
          firebaseUser,
          verificationSent,
          emailVerified: firebaseUser.emailVerified,
          message: verificationSent
            ? "Account created successfully. Please verify your email."
            : "Account created successfully.",
        };
      } catch (error) {
        console.error(
          "REGISTER ERROR:",
          error?.response?.data || error?.message || error,
        );

        await signOutFirebaseOnly();

        throw error;
      } finally {
        operationRef.current = false;
      }
    },
    [registerUserInDatabase, validateDatabaseUser, signOutFirebaseOnly],
  );

  // ==========================================================
  // EMAIL LOGIN
  // ==========================================================

  const loginUser = useCallback(
    async (email, password) => {
      if (operationRef.current) {
        throw new Error("Another authentication operation is already running.");
      }

      const cleanEmail = normalizeEmail(email);
      const cleanPassword = typeof password === "string" ? password : "";

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!cleanPassword) {
        throw new Error("Password is required.");
      }

      operationRef.current = true;

      try {
        // ----------------------------------------------------
        // FIREBASE LOGIN
        // ----------------------------------------------------

        const result = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        let firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Login failed.");
        }

        // ----------------------------------------------------
        // RELOAD
        // ----------------------------------------------------

        await reload(firebaseUser);

        firebaseUser = auth.currentUser;

        if (!firebaseUser) {
          throw new Error("Unable to load Firebase user.");
        }

        // ----------------------------------------------------
        // FRESH TOKEN
        // ----------------------------------------------------

        const token = await getFirebaseToken(firebaseUser, true);

        // ----------------------------------------------------
        // DATABASE USER
        // ----------------------------------------------------

        const response = await axiosPublic.get(ENDPOINTS.ME, {
          timeout: REQUEST_TIMEOUT,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response?.data?.success || !response?.data?.user) {
          throw new Error(
            response?.data?.message || "Unable to load authenticated user.",
          );
        }

        const databaseUser = validateDatabaseUser(response.data.user);

        // ----------------------------------------------------
        // APPLICATION USER
        // ----------------------------------------------------

        if (mountedRef.current) {
          setUser(databaseUser);
        }

        return {
          success: true,
          user: databaseUser,
          firebaseUser,
          emailVerified: firebaseUser.emailVerified,
          message: "Login successful.",
        };
      } catch (error) {
        console.error(
          "LOGIN ERROR:",
          error?.response?.data || error?.message || error,
        );

        await signOutFirebaseOnly();

        throw error;
      } finally {
        operationRef.current = false;
      }
    },
    [getFirebaseToken, validateDatabaseUser, signOutFirebaseOnly],
  );

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const signInWithGoogle = useCallback(async () => {
    if (operationRef.current) {
      throw new Error("Another authentication operation is already running.");
    }

    operationRef.current = true;

    try {
      // ----------------------------------------------------
      // GOOGLE AUTH
      // ----------------------------------------------------

      const result = await signInWithPopup(auth, googleProvider);

      let firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Google authentication failed.");
      }

      await reload(firebaseUser);

      firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("Unable to load Google authenticated user.");
      }

      // ----------------------------------------------------
      // FRESH TOKEN
      // ----------------------------------------------------

      const token = await getFirebaseToken(firebaseUser, true);

      // ----------------------------------------------------
      // GOOGLE USER DATA
      // ----------------------------------------------------

      const googleName =
        normalizeString(firebaseUser.displayName) ||
        normalizeString(firebaseUser.email?.split("@")[0]) ||
        "User";

      const googlePhoto = normalizeString(firebaseUser.photoURL);

      let databaseUser = null;

      // ----------------------------------------------------
      // CREATE / FIND DATABASE USER
      // ----------------------------------------------------

      try {
        const registerResponse = await registerUserInDatabase(firebaseUser, {
          name: googleName,
          photo: googlePhoto,
        });

        databaseUser = registerResponse?.user || null;
      } catch (registerError) {
        const statusCode = registerError?.response?.status;

        const backendCode = registerError?.response?.data?.code;

        const backendMessage = String(
          registerError?.response?.data?.message || "",
        ).toLowerCase();

        const alreadyExists =
          statusCode === 409 ||
          backendCode === "user/duplicate" ||
          backendCode === "user/email-conflict" ||
          backendCode === "user/uid-conflict" ||
          backendMessage.includes("already exists") ||
          backendMessage.includes("already registered");

        if (!alreadyExists) {
          throw registerError;
        }
      }

      // ----------------------------------------------------
      // LOAD EXISTING DATABASE USER
      // ----------------------------------------------------

      if (!databaseUser) {
        const response = await axiosPublic.get(ENDPOINTS.ME, {
          timeout: REQUEST_TIMEOUT,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response?.data?.success || !response?.data?.user) {
          throw new Error(
            response?.data?.message || "Unable to load Google user.",
          );
        }

        databaseUser = response.data.user;
      }

      databaseUser = validateDatabaseUser(databaseUser);

      // ----------------------------------------------------
      // APPLICATION USER
      // ----------------------------------------------------

      if (mountedRef.current) {
        setUser(databaseUser);
      }

      const isNewUser = result?.additionalUserInfo?.isNewUser ?? false;

      return {
        success: true,
        user: databaseUser,
        firebaseUser,
        emailVerified: firebaseUser.emailVerified,
        isNewUser,
        message: isNewUser
          ? "Google account created successfully. Welcome!"
          : "Google sign-in successful. Welcome back!",
      };
    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      const cancelled =
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request";

      if (!cancelled) {
        await signOutFirebaseOnly();
      }

      throw error;
    } finally {
      operationRef.current = false;
    }
  }, [
    getFirebaseToken,
    registerUserInDatabase,
    validateDatabaseUser,
    signOutFirebaseOnly,
  ]);

  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================

  const updateUserProfile = useCallback(
    async (name, photo = "") => {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("No authenticated Firebase user.");
      }

      const cleanName = normalizeString(name);
      const cleanPhoto = normalizeString(photo);

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      if (cleanName.length < 2) {
        throw new Error("Name must contain at least 2 characters.");
      }

      const previousName = firebaseUser.displayName || "";

      const previousPhoto = firebaseUser.photoURL || "";

      try {
        // ----------------------------------------------------
        // FIREBASE PROFILE
        // ----------------------------------------------------

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: cleanPhoto || null,
        });

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to reload Firebase user.");
        }

        // ----------------------------------------------------
        // DATABASE PROFILE
        // ----------------------------------------------------

        const token = await getFirebaseToken(currentFirebaseUser, true);

        const response = await axiosPublic.patch(
          ENDPOINTS.PROFILE,
          {
            name: cleanName,
            photo: cleanPhoto,
          },
          {
            timeout: REQUEST_TIMEOUT,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response?.data?.success) {
          throw new Error(
            response?.data?.message || "Failed to update profile.",
          );
        }

        // ----------------------------------------------------
        // UPDATED USER
        // ----------------------------------------------------

        const updatedUser =
          response?.data?.user ||
          (await getCurrentUser(currentFirebaseUser, true));

        const validatedUser = validateDatabaseUser(updatedUser);

        if (mountedRef.current) {
          setUser(validatedUser);
        }

        return {
          success: true,
          user: validatedUser,
          firebaseUser: currentFirebaseUser,
          message: response?.data?.message || "Profile updated successfully.",
        };
      } catch (error) {
        // ----------------------------------------------------
        // FIREBASE ROLLBACK
        // ----------------------------------------------------

        try {
          await updateProfile(firebaseUser, {
            displayName: previousName,
            photoURL: previousPhoto || null,
          });

          await reload(firebaseUser);
        } catch (rollbackError) {
          console.warn(
            "PROFILE ROLLBACK:",
            getErrorMessage(rollbackError, "Profile rollback failed."),
          );
        }

        throw error;
      }
    },
    [getFirebaseToken, getCurrentUser, validateDatabaseUser],
  );

  // ==========================================================
  // REFRESH USER
  // ==========================================================

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      if (mountedRef.current) {
        setUser(null);
      }

      return null;
    }

    await reload(firebaseUser);

    const currentFirebaseUser = auth.currentUser;

    if (!currentFirebaseUser) {
      if (mountedRef.current) {
        setUser(null);
      }

      return null;
    }

    const databaseUser = await loadApplicationUser(currentFirebaseUser, true);

    if (mountedRef.current) {
      setUser(databaseUser);
    }

    return databaseUser;
  }, [loadApplicationUser]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logOutUser = useCallback(async () => {
    if (operationRef.current) {
      return;
    }

    operationRef.current = true;

    try {
      await logoutBackend();

      if (auth.currentUser) {
        await signOut(auth);
      }

      if (mountedRef.current) {
        setUser(null);
      }
    } catch (error) {
      console.error("LOGOUT ERROR:", getErrorMessage(error, "Logout failed."));

      throw error;
    } finally {
      operationRef.current = false;
    }
  }, [logoutBackend]);

  const signOutUser = logOutUser;

  // ==========================================================
  // RESEND EMAIL VERIFICATION
  // ==========================================================

  const resendEmailVerification = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error("No authenticated Firebase user.");
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
  // CLEAR USER
  // ==========================================================

  const clearUser = useCallback(() => {
    if (mountedRef.current) {
      setUser(null);
    }
  }, []);

  // ==========================================================
  // AUTH STATE LISTENER
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mountedRef.current) {
        return;
      }

      if (operationRef.current) {
        return;
      }

      try {
        // --------------------------------------------------
        // NO USER
        // --------------------------------------------------

        if (!firebaseUser) {
          setUser(null);
          return;
        }

        // --------------------------------------------------
        // RELOAD FIREBASE USER
        // --------------------------------------------------

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          setUser(null);
          return;
        }

        // --------------------------------------------------
        // LOAD DATABASE USER
        // --------------------------------------------------

        const databaseUser = await loadApplicationUser(
          currentFirebaseUser,
          true,
        );

        if (mountedRef.current) {
          setUser(databaseUser);
        }
      } catch (error) {
        console.warn(
          "AUTH SESSION RESTORE:",
          getErrorMessage(error, "Unable to restore authentication session."),
        );

        try {
          if (auth.currentUser) {
            await signOut(auth);
          }
        } catch (signOutError) {
          console.warn(
            "SESSION CLEANUP:",
            getErrorMessage(signOutError, "Session cleanup failed."),
          );
        }

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
  }, [loadApplicationUser]);

  // ==========================================================
  // AUTH CONTEXT VALUE
  // ==========================================================

  const authInfo = useMemo(
    () => ({
      user,
      loading,

      role,
      status,

      createUser,

      loginUser,
      signInUser: loginUser,

      signInWithGoogle,

      updateUserProfile,

      refreshUser,

      getCurrentUser,

      resendEmailVerification,

      logOutUser,
      signOutUser,

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
      updateUserProfile,
      refreshUser,
      getCurrentUser,
      resendEmailVerification,
      logOutUser,
      signOutUser,
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

export default AuthProvider;
