

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
import axiosSecure from "../hooks/axiosSecure";

export const AuthContext = createContext(null);

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

const REQUEST_TIMEOUT = 15000;

const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  JWT: "/auth/jwt",
  ME: "/auth/me",
  PROFILE: "/auth/profile",
  LOGOUT: "/auth/logout",
};

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeString = (value = "") => {
  return typeof value === "string" ? value.trim() : "";
};

const normalizeEmail = (value = "") => {
  return normalizeString(value).toLowerCase();
};

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const createAuthError = (message, code = "", response = null) => {
  const error = new Error(message);

  error.code = code;
  error.response = response;

  return error;
};

/* -------------------------------------------------------------------------- */
/* AUTH PROVIDER                                                              */
/* -------------------------------------------------------------------------- */

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(false);
  const authOperationRef = useRef(false);

  const role = user?.role || "user";
  const status = user?.status || "active";

  /* ------------------------------------------------------------------------ */
  /* CONFIG CHECK                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!API_URL) {
      console.warn(
        "VITE_API_URL is missing. Authentication API requests may fail.",
      );
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* FIREBASE TOKEN                                                           */
  /* ------------------------------------------------------------------------ */

  const getFirebaseIdToken = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      throw new Error("Firebase user is unavailable.");
    }

    const token = await firebaseUser.getIdToken(true);

    if (!token) {
      throw new Error("Unable to get Firebase ID token.");
    }

    return token;
  }, []);

  /* ------------------------------------------------------------------------ */
  /* AUTHENTICATED REQUEST CONFIG                                             */
  /* ------------------------------------------------------------------------ */

  const getAuthConfig = useCallback(
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

  /* ------------------------------------------------------------------------ */
  /* GET CURRENT DATABASE USER                                                */
  /* ------------------------------------------------------------------------ */

  const getCurrentUser = useCallback(async () => {
    if (!API_URL) {
      throw new Error(
        "VITE_API_URL is missing. Please check your environment variables.",
      );
    }

    try {
      const response = await axiosSecure.get(AUTH_ENDPOINTS.ME);

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

  /* ------------------------------------------------------------------------ */
  /* BACKEND LOGOUT                                                           */
  /* ------------------------------------------------------------------------ */

  const logoutBackendSession = useCallback(async () => {
    try {
      await axiosPublic.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn(
        "BACKEND LOGOUT ERROR:",
        getErrorMessage(error, "Backend logout failed."),
      );
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* COMPLETE AUTH CLEANUP                                                    */
  /* ------------------------------------------------------------------------ */

  const cleanupAuthentication = useCallback(async () => {
    await logoutBackendSession();

    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.warn(
        "FIREBASE CLEANUP ERROR:",
        getErrorMessage(error, "Firebase logout failed."),
      );
    }

    if (mountedRef.current) {
      setUser(null);
    }
  }, [logoutBackendSession]);

  /* ------------------------------------------------------------------------ */
  /* REGISTER USER IN DATABASE                                                */
  /* ------------------------------------------------------------------------ */

  const registerUserInDatabase = useCallback(
    async (firebaseUser, additionalData = {}) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is unavailable.");
      }

      const config = await getAuthConfig(firebaseUser);

      const name =
        typeof additionalData.name === "string"
          ? normalizeString(additionalData.name)
          : normalizeString(firebaseUser.displayName);

      const photo =
        typeof additionalData.photo === "string"
          ? normalizeString(additionalData.photo)
          : normalizeString(firebaseUser.photoURL);

      try {
        const response = await axiosPublic.post(
          AUTH_ENDPOINTS.REGISTER,
          {
            name,
            photo,
          },
          {
            ...config,
            timeout: REQUEST_TIMEOUT,
          },
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
          "REGISTER DATABASE ERROR:",
          error?.response?.data || error?.message || error,
        );

        throw error;
      }
    },
    [getAuthConfig],
  );

  /* ------------------------------------------------------------------------ */
  /* CREATE BACKEND SESSION / JWT                                             */
  /* ------------------------------------------------------------------------ */

  const createApplicationSession = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is unavailable.");
      }

      const config = await getAuthConfig(firebaseUser);

      try {
        const response = await axiosPublic.post(
          AUTH_ENDPOINTS.JWT,
          {},
          {
            ...config,
            timeout: REQUEST_TIMEOUT,
          },
        );

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
    [getAuthConfig],
  );

  /* ------------------------------------------------------------------------ */
  /* CREATE USER                                                              */
  /* ------------------------------------------------------------------------ */

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
        /* ------------------------------------------------------------------ */
        /* FIREBASE REGISTER                                                   */
        /* ------------------------------------------------------------------ */

        const result = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        const firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Failed to create Firebase account.");
        }

        /* ------------------------------------------------------------------ */
        /* FIREBASE PROFILE                                                    */
        /* ------------------------------------------------------------------ */

        const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          cleanName,
        )}&size=256`;

        const finalPhoto = cleanPhoto || fallbackPhoto;

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: finalPhoto,
        });

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to load newly created Firebase user.");
        }

        /* ------------------------------------------------------------------ */
        /* DATABASE REGISTER                                                   */
        /* ------------------------------------------------------------------ */

        const registerResponse = await registerUserInDatabase(
          currentFirebaseUser,
          {
            name: cleanName,
            photo: finalPhoto,
          },
        );

        /* ------------------------------------------------------------------ */
        /* CREATE BACKEND SESSION                                              */
        /* ------------------------------------------------------------------ */

        const sessionResponse =
          await createApplicationSession(currentFirebaseUser);

        const databaseUser =
          sessionResponse?.user ||
          registerResponse?.user ||
          (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your user account.");
        }

        if (databaseUser.status === "blocked") {
          throw new Error("Your account has been blocked.");
        }

        if (databaseUser.status && databaseUser.status !== "active") {
          throw new Error("Your account is not active.");
        }

        /* ------------------------------------------------------------------ */
        /* EMAIL VERIFICATION                                                  */
        /* ------------------------------------------------------------------ */

        let verificationSent = false;

        if (!currentFirebaseUser.emailVerified) {
          try {
            await sendEmailVerification(currentFirebaseUser);

            verificationSent = true;
          } catch (verificationError) {
            console.warn(
              "EMAIL VERIFICATION ERROR:",
              getErrorMessage(
                verificationError,
                "Verification email could not be sent.",
              ),
            );
          }
        }

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

  /* ------------------------------------------------------------------------ */
  /* LOGIN                                                                    */
  /* ------------------------------------------------------------------------ */

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
        /* ------------------------------------------------------------------ */
        /* FIREBASE LOGIN                                                      */
        /* ------------------------------------------------------------------ */

        const result = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );

        const firebaseUser = result?.user;

        if (!firebaseUser) {
          throw new Error("Login failed.");
        }

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Authenticated Firebase user could not be loaded.");
        }

        /* ------------------------------------------------------------------ */
        /* SYNC USER                                                           */
        /* ------------------------------------------------------------------ */

        const registerResponse =
          await registerUserInDatabase(currentFirebaseUser);

        /* ------------------------------------------------------------------ */
        /* CREATE BACKEND SESSION                                              */
        /* ------------------------------------------------------------------ */

        const sessionResponse =
          await createApplicationSession(currentFirebaseUser);

        const databaseUser =
          sessionResponse?.user ||
          registerResponse?.user ||
          (await getCurrentUser());

        if (!databaseUser) {
          throw new Error("Unable to load your user account.");
        }

        if (databaseUser.status === "blocked") {
          throw new Error("Your account has been blocked.");
        }

        if (databaseUser.status && databaseUser.status !== "active") {
          throw new Error("Your account is not active.");
        }

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

  /* ------------------------------------------------------------------------ */
  /* GOOGLE LOGIN                                                             */
  /* ------------------------------------------------------------------------ */

  const signInWithGoogle = useCallback(async () => {
    if (authOperationRef.current) {
      throw new Error("Another authentication operation is already running.");
    }

    authOperationRef.current = true;

    try {
      const result = await signInWithPopup(auth, googleProvider);

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Google authentication failed.");
      }

      await reload(firebaseUser);

      const currentFirebaseUser = auth.currentUser;

      if (!currentFirebaseUser) {
        throw new Error("Unable to load Google Firebase user.");
      }

      /* ------------------------------------------------------------------ */
      /* SYNC USER                                                           */
      /* ------------------------------------------------------------------ */

      const registerResponse = await registerUserInDatabase(
        currentFirebaseUser,
        {
          name: currentFirebaseUser.displayName || "",
          photo: currentFirebaseUser.photoURL || "",
        },
      );

      /* ------------------------------------------------------------------ */
      /* CREATE BACKEND SESSION                                              */
      /* ------------------------------------------------------------------ */

      const sessionResponse =
        await createApplicationSession(currentFirebaseUser);

      const databaseUser =
        sessionResponse?.user ||
        registerResponse?.user ||
        (await getCurrentUser());

      if (!databaseUser) {
        throw new Error("Unable to load Google user account.");
      }

      if (databaseUser.status === "blocked") {
        throw new Error("Your account has been blocked.");
      }

      if (databaseUser.status && databaseUser.status !== "active") {
        throw new Error("Your account is not active.");
      }

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

  /* ------------------------------------------------------------------------ */
  /* UPDATE PROFILE                                                           */
  /* ------------------------------------------------------------------------ */

  const updateUserProfile = useCallback(
    async (name, photo = "") => {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("No authenticated Firebase user found.");
      }

      const cleanName = normalizeString(name);

      const cleanPhoto = normalizeString(photo);

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      if (cleanName.length < 2) {
        throw new Error("Name must contain at least 2 characters.");
      }

      if (cleanName.length > 100) {
        throw new Error("Name cannot exceed 100 characters.");
      }

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

      const previousName = firebaseUser.displayName || "";

      const previousPhoto = firebaseUser.photoURL || "";

      try {
        /* ---------------------------------------------------------------- */
        /* UPDATE FIREBASE                                                   */
        /* ---------------------------------------------------------------- */

        await updateProfile(firebaseUser, {
          displayName: cleanName,
          photoURL: cleanPhoto || null,
        });

        await reload(firebaseUser);

        const currentFirebaseUser = auth.currentUser;

        if (!currentFirebaseUser) {
          throw new Error("Unable to reload Firebase user.");
        }

        /* ---------------------------------------------------------------- */
        /* UPDATE BACKEND                                                    */
        /* ---------------------------------------------------------------- */

        const config = await getAuthConfig(currentFirebaseUser);

        const response = await axiosPublic.patch(
          AUTH_ENDPOINTS.PROFILE,
          {
            name: cleanName,
            photo: cleanPhoto,
          },
          {
            ...config,
            timeout: REQUEST_TIMEOUT,
          },
        );

        if (!response?.data?.success) {
          throw createAuthError(
            response?.data?.message || "Failed to update your profile.",
            response?.data?.code || "",
            response,
          );
        }

        const updatedUser = response?.data?.user || (await getCurrentUser());

        if (!updatedUser) {
          throw new Error(
            "Profile updated, but user data could not be loaded.",
          );
        }

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
        /* --------------------------------------------------------------- */
        /* FIREBASE ROLLBACK                                                */
        /* --------------------------------------------------------------- */

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
            getErrorMessage(rollbackError, "Rollback failed."),
          );
        }

        console.error(
          "UPDATE PROFILE ERROR:",
          error?.response?.data || error?.message || error,
        );

        throw error;
      }
    },
    [getAuthConfig, getCurrentUser],
  );

  /* ------------------------------------------------------------------------ */
  /* LOGOUT                                                                   */
  /* ------------------------------------------------------------------------ */

  const logOutUser = useCallback(async () => {
    if (authOperationRef.current) {
      return;
    }

    authOperationRef.current = true;

    try {
      await logoutBackendSession();

      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (error) {
        console.warn(
          "FIREBASE LOGOUT ERROR:",
          getErrorMessage(error, "Firebase logout failed."),
        );
      }

      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      authOperationRef.current = false;
    }
  }, [logoutBackendSession]);

  const signOutUser = logOutUser;

  /* ------------------------------------------------------------------------ */
  /* RESEND EMAIL VERIFICATION                                                */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* REFRESH USER                                                             */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* CLEAR USER                                                               */
  /* ------------------------------------------------------------------------ */

  const clearUser = useCallback(() => {
    if (mountedRef.current) {
      setUser(null);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* INITIAL AUTH STATE                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mountedRef.current) {
        return;
      }

      if (authOperationRef.current) {
        return;
      }

      try {
        /* -------------------------------------------------------------- */
        /* NO FIREBASE USER                                                */
        /* -------------------------------------------------------------- */

        if (!firebaseUser) {
          if (mountedRef.current) {
            setUser(null);
          }

          return;
        }

        /* -------------------------------------------------------------- */
        /* IMPORTANT                                                       */
        /* -------------------------------------------------------------- */
        /*
         * Firebase authentication exists.
         *
         * We first create/refresh the backend
         * application session using the Firebase
         * ID token.
         */

        try {
          await createApplicationSession(firebaseUser);

          const databaseUser = await getCurrentUser();

          if (mountedRef.current && databaseUser) {
            setUser(databaseUser);
          }
        } catch (error) {
          console.warn(
            "AUTH SESSION RESTORE:",
            getErrorMessage(error, "Unable to restore application session."),
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
  }, [createApplicationSession, getCurrentUser]);

  /* ------------------------------------------------------------------------ */
  /* CONTEXT VALUE                                                            */
  /* ------------------------------------------------------------------------ */

  const authInfo = useMemo(
    () => ({
      user,
      loading,

      role,
      status,

      createUser,
      loginUser,

      signInWithGoogle,

      logOutUser,
      signOutUser,

      // Compatibility
      signInUser: loginUser,

      updateUserProfile,

      refreshUser,
      resendEmailVerification,

      getCurrentUser,

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

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
