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
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import axios from "axios";

import auth from "./firebase.config";

// ============================================================
// AUTH CONTEXT
// ============================================================

export const AuthContext = createContext(null);

// ============================================================
// API
// ============================================================

const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

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

  const isRegisteringRef = useRef(false);
  const syncingUidRef = useRef(null);
  const explicitAuthActionRef = useRef(false);

  // ==========================================================
  // ENSURE API
  // ==========================================================

  const ensureApi = useCallback(() => {
    if (!API) {
      throw new Error("VITE_API_URL is not configured.");
    }

    return API;
  }, []);

  // ==========================================================
  // FIREBASE TOKEN
  // ==========================================================

  const getFirebaseToken = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      throw new Error("Firebase user is required.");
    }

    return firebaseUser.getIdToken(true);
  }, []);

  // ==========================================================
  // NORMALIZE USER
  // ==========================================================

  const normalizeUser = useCallback((serverUser) => {
    if (!serverUser) {
      return null;
    }

    const source = serverUser?.user || serverUser;

    if (!source || typeof source !== "object") {
      return null;
    }

    return {
      _id: source._id || null,

      uid: source.uid || "",

      name: typeof source.name === "string" ? source.name.trim() : "",

      email:
        typeof source.email === "string"
          ? source.email.trim().toLowerCase()
          : "",

      photo: typeof source.photo === "string" ? source.photo.trim() : "",

      role:
        typeof source.role === "string"
          ? source.role.trim().toLowerCase()
          : "user",

      provider:
        typeof source.provider === "string"
          ? source.provider.trim()
          : "password",

      status:
        typeof source.status === "string"
          ? source.status.trim().toLowerCase()
          : "active",

      createdAt: source.createdAt || null,

      updatedAt: source.updatedAt || null,

      lastLogin: source.lastLogin || null,
    };
  }, []);

  // ==========================================================
  // SAVE USER TO DATABASE
  // ==========================================================

  const saveUserToDatabase = useCallback(
    async (firebaseUser, profile = {}) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is required.");
      }

      const baseURL = ensureApi();

      const token = await getFirebaseToken(firebaseUser);

      const userInfo = {
        name:
          typeof profile.name === "string"
            ? profile.name.trim()
            : firebaseUser.displayName || "",

        photo:
          typeof profile.photo === "string"
            ? profile.photo.trim()
            : firebaseUser.photoURL || "",
      };

      const response = await axios.post(`${baseURL}/users`, userInfo, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        withCredentials: true,

        timeout: 15000,
      });

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to synchronize user.",
        );
      }

      return response.data;
    },
    [ensureApi, getFirebaseToken],
  );

  // ==========================================================
  // CREATE APPLICATION SESSION
  // ==========================================================

  const createApplicationSession = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser) {
        throw new Error("Firebase user is required.");
      }

      const baseURL = ensureApi();

      const token = await getFirebaseToken(firebaseUser);

      // --------------------------------------------------------
      // CREATE JWT COOKIE
      // --------------------------------------------------------

      const jwtResponse = await axios.post(
        `${baseURL}/auth/jwt`,
        {
          token,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          withCredentials: true,

          timeout: 15000,
        },
      );

      if (!jwtResponse?.data?.success) {
        throw new Error(
          jwtResponse?.data?.message || "Failed to create application session.",
        );
      }

      // --------------------------------------------------------
      // GET CURRENT USER
      // --------------------------------------------------------

      const meResponse = await axios.get(`${baseURL}/auth/me`, {
        withCredentials: true,

        timeout: 15000,
      });

      if (!meResponse?.data?.success || !meResponse?.data?.user) {
        throw new Error(
          meResponse?.data?.message || "Unable to load authenticated user.",
        );
      }

      return normalizeUser(meResponse.data.user);
    },
    [ensureApi, getFirebaseToken, normalizeUser],
  );

  // ==========================================================
  // CLEAR APPLICATION SESSION
  // ==========================================================

  const clearApplicationSession = useCallback(async () => {
    if (!API) {
      return;
    }

    try {
      await axios.post(
        `${API}/auth/logout`,
        {},
        {
          withCredentials: true,
          timeout: 10000,
        },
      );
    } catch (error) {
      console.error(
        "BACKEND LOGOUT ERROR:",
        error?.response?.data || error?.message || error,
      );
    }
  }, []);

  // ==========================================================
  // REGISTER
  // ==========================================================

  const createUser = useCallback(
    async (email, password, name = "") => {
      if (!email || !password) {
        throw new Error("Email and password are required.");
      }

      isRegisteringRef.current = true;

      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );

        const firebaseUser = credential?.user;

        if (!firebaseUser) {
          throw new Error("Unable to create your account.");
        }

        const cleanName = typeof name === "string" ? name.trim() : "";

        // ------------------------------------------------------
        // UPDATE FIREBASE PROFILE
        // ------------------------------------------------------

        if (cleanName) {
          await updateProfile(firebaseUser, {
            displayName: cleanName,
            photoURL: "",
          });

          await firebaseUser.reload();
        }

        // ------------------------------------------------------
        // SAVE USER TO MONGODB
        // ------------------------------------------------------

        await saveUserToDatabase(firebaseUser, {
          name: cleanName,
          photo: firebaseUser.photoURL || "",
        });

        // Registration does not create application session.
        // User must verify email and login.

        setUser(null);

        return credential;
      } catch (error) {
        console.error(
          "CREATE USER ERROR:",
          error?.response?.data || error?.message || error,
        );

        throw error;
      } finally {
        setTimeout(() => {
          isRegisteringRef.current = false;
        }, 1000);
      }
    },
    [saveUserToDatabase],
  );

  // ==========================================================
  // LOGIN
  // ==========================================================

  const loginUser = useCallback(
    async (email, password) => {
      if (!email || !password) {
        throw new Error("Email and password are required.");
      }

      explicitAuthActionRef.current = true;

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );

        const firebaseUser = credential?.user;

        if (!firebaseUser) {
          throw new Error("Unable to login.");
        }

        await firebaseUser.reload();

        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("Unable to load your Firebase account.");
        }

        // ------------------------------------------------------
        // SYNC USER
        // ------------------------------------------------------

        await saveUserToDatabase(currentUser, {
          name: currentUser.displayName || "",
          photo: currentUser.photoURL || "",
        });

        // ------------------------------------------------------
        // CREATE SERVER SESSION
        // ------------------------------------------------------

        const serverUser = await createApplicationSession(currentUser);

        if (!serverUser) {
          throw new Error("Unable to load your account.");
        }

        setUser(serverUser);

        syncingUidRef.current = currentUser.uid;

        return serverUser;
      } catch (error) {
        console.error(
          "LOGIN ERROR:",
          error?.response?.data || error?.message || error,
        );

        setUser(null);

        syncingUidRef.current = null;

        try {
          await clearApplicationSession();
        } catch (logoutError) {
          console.error("LOGIN BACKEND CLEANUP ERROR:", logoutError);
        }

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("LOGIN FIREBASE CLEANUP ERROR:", signOutError);
        }

        throw error;
      } finally {
        explicitAuthActionRef.current = false;
      }
    },
    [clearApplicationSession, createApplicationSession, saveUserToDatabase],
  );

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const signInGoogle = useCallback(async () => {
    explicitAuthActionRef.current = true;

    try {
      const result = await signInWithPopup(auth, googleProvider);

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        throw new Error("Google sign-in was not completed.");
      }

      await firebaseUser.reload();

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Unable to load Google account.");
      }

      const googleName = currentUser.displayName || "";

      const googlePhoto = currentUser.photoURL || "";

      // ------------------------------------------------------
      // SAVE / UPDATE MONGODB USER
      // ------------------------------------------------------

      await saveUserToDatabase(currentUser, {
        name: googleName,
        photo: googlePhoto,
      });

      // ------------------------------------------------------
      // CREATE APPLICATION SESSION
      // ------------------------------------------------------

      const serverUser = await createApplicationSession(currentUser);

      if (!serverUser) {
        throw new Error("Unable to load Google account.");
      }

      setUser(serverUser);

      syncingUidRef.current = currentUser.uid;

      return serverUser;
    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      setUser(null);

      syncingUidRef.current = null;

      try {
        await clearApplicationSession();
      } catch (logoutError) {
        console.error("GOOGLE BACKEND CLEANUP ERROR:", logoutError);
      }

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("GOOGLE FIREBASE CLEANUP ERROR:", signOutError);
      }

      throw error;
    } finally {
      explicitAuthActionRef.current = false;
    }
  }, [clearApplicationSession, createApplicationSession, saveUserToDatabase]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const signOutUser = useCallback(async () => {
    explicitAuthActionRef.current = true;

    try {
      // ------------------------------------------------------
      // BACKEND LOGOUT
      // ------------------------------------------------------

      await clearApplicationSession();

      // ------------------------------------------------------
      // FIREBASE LOGOUT
      // ------------------------------------------------------

      await signOut(auth);

      // ------------------------------------------------------
      // CLEAR CLIENT STATE
      // ------------------------------------------------------

      setUser(null);

      syncingUidRef.current = null;
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error?.response?.data || error?.message || error,
      );

      setUser(null);

      syncingUidRef.current = null;

      throw error;
    } finally {
      explicitAuthActionRef.current = false;
    }
  }, [clearApplicationSession]);

  // ==========================================================
  // AUTH STATE OBSERVER
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

      // ----------------------------------------------------
      // NO FIREBASE USER
      // ----------------------------------------------------

      if (!firebaseUser) {
        setUser(null);
        syncingUidRef.current = null;
        setLoading(false);

        return;
      }

      // ----------------------------------------------------
      // REGISTRATION
      // ----------------------------------------------------

      if (isRegisteringRef.current) {
        setUser(null);
        setLoading(false);

        return;
      }

      // ----------------------------------------------------
      // EXPLICIT LOGIN / GOOGLE / LOGOUT
      // ----------------------------------------------------

      if (explicitAuthActionRef.current) {
        setLoading(false);

        return;
      }

      // ----------------------------------------------------
      // ALREADY SYNCHRONIZED
      // ----------------------------------------------------

      if (syncingUidRef.current === firebaseUser.uid) {
        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        await firebaseUser.reload();

        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("Firebase user session is unavailable.");
        }

        // --------------------------------------------------
        // SYNC USER
        // --------------------------------------------------

        await saveUserToDatabase(currentUser, {
          name: currentUser.displayName || "",
          photo: currentUser.photoURL || "",
        });

        // --------------------------------------------------
        // RESTORE SERVER SESSION
        // --------------------------------------------------

        const serverUser = await createApplicationSession(currentUser);

        if (!serverUser) {
          throw new Error("Unable to restore your account.");
        }

        if (!mounted) {
          return;
        }

        setUser(serverUser);

        syncingUidRef.current = currentUser.uid;
      } catch (error) {
        console.error(
          "AUTH SYNCHRONIZATION ERROR:",
          error?.response?.data || error?.message || error,
        );

        if (!mounted) {
          return;
        }

        setUser(null);

        syncingUidRef.current = null;

        try {
          await clearApplicationSession();
        } catch (logoutError) {
          console.error("AUTH BACKEND CLEANUP ERROR:", logoutError);
        }

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("AUTH FIREBASE CLEANUP ERROR:", signOutError);
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
  }, [clearApplicationSession, createApplicationSession, saveUserToDatabase]);

  // ==========================================================
  // AUTH CONTEXT VALUE
  // ==========================================================

  const authInfo = useMemo(
    () => ({
      user,
      loading,

      createUser,
      loginUser,
      signInGoogle,
      signOutUser,

      saveUserToDatabase,
    }),
    [
      user,
      loading,
      createUser,
      loginUser,
      signInGoogle,
      signOutUser,
      saveUserToDatabase,
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
