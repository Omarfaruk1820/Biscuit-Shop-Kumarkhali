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
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";

import auth from "./firebase.config";
import axiosPublic from "../hooks/axiosPublic";

export const AuthContext = createContext(null);

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // NORMALIZE EMAIL
  // ==========================================================

  const normalizeEmail = useCallback((email = "") => {
    return String(email).trim().toLowerCase();
  }, []);

  // ==========================================================
  // SAVE USER TO DATABASE
  // ==========================================================

  const saveUserToDatabase = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser?.email) {
        throw new Error("User email not found.");
      }

      const email = normalizeEmail(firebaseUser.email);

      const payload = {
        name: String(firebaseUser.displayName || "").trim(),
        email,
        photo: String(firebaseUser.photoURL || "").trim(),
        provider: firebaseUser.providerData?.[0]?.providerId || "password",
        emailVerified: Boolean(firebaseUser.emailVerified),
      };

      const response = await axiosPublic.post("/users", payload);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to save user.");
      }

      return response.data;
    },
    [normalizeEmail],
  );

  // ==========================================================
  // CREATE APPLICATION JWT
  // ==========================================================

  const createJWT = useCallback(
    async (email) => {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        throw new Error("User email is required.");
      }

      const response = await axiosPublic.post("/auth/jwt", {
        email: normalizedEmail,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to generate authentication token.",
        );
      }

      return response.data;
    },
    [normalizeEmail],
  );

  // ==========================================================
  // GET CURRENT DATABASE USER
  // ==========================================================

  const getCurrentUser = useCallback(async () => {
    const response = await axiosPublic.get("/auth/me");

    if (!response.data?.success || !response.data?.user) {
      throw new Error(
        response.data?.message || "Failed to load authenticated user.",
      );
    }

    return response.data.user;
  }, []);

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const createUser = useCallback(
    async (email, password) => {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      return createUserWithEmailAndPassword(auth, normalizedEmail, password);
    },
    [normalizeEmail],
  );

  // ==========================================================
  // LOGIN USER
  // ==========================================================

  const loginUser = useCallback(
    async (email, password) => {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      return signInWithEmailAndPassword(auth, normalizedEmail, password);
    },
    [normalizeEmail],
  );

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const signInGoogle = useCallback(async () => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  // ==========================================================
  // UPDATE USER PROFILE
  // ==========================================================

  const updateUserProfile = useCallback(async (name, photo = "") => {
    if (!auth.currentUser) {
      throw new Error("Authenticated user not found.");
    }

    const cleanName = String(name || "").trim();
    const cleanPhoto = String(photo || "").trim();

    await updateProfile(auth.currentUser, {
      displayName: cleanName,
      photoURL: cleanPhoto,
    });

    setUser((previousUser) => {
      if (!previousUser) {
        return previousUser;
      }

      return {
        ...previousUser,
        name: cleanName,
        photo: cleanPhoto,
      };
    });

    return auth.currentUser;
  }, []);

  // ==========================================================
  // CLEAR USER
  // ==========================================================

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const signOutUser = useCallback(async () => {
    try {
      // Clear server JWT cookie
      try {
        await axiosPublic.post("/auth/logout");
      } catch (error) {
        console.error("SERVER LOGOUT ERROR:", error);
      }

      // Clear Firebase session
      await signOut(auth);

      // Clear React user state
      setUser(null);
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
      throw error;
    }
  }, []);

  // ==========================================================
  // BUILD APPLICATION USER
  // ==========================================================

  const buildUser = useCallback(
    (firebaseUser, dbUser) => {
      const firebaseEmail = normalizeEmail(firebaseUser?.email);

      return {
        uid: firebaseUser?.uid || "",

        name: dbUser?.name || firebaseUser?.displayName || "",

        email: dbUser?.email || firebaseEmail,

        photo: dbUser?.photo || firebaseUser?.photoURL || "",

        role: dbUser?.role || "customer",

        status: dbUser?.status || "active",

        provider:
          dbUser?.provider ||
          firebaseUser?.providerData?.[0]?.providerId ||
          "password",

        createdAt: dbUser?.createdAt || null,

        updatedAt: dbUser?.updatedAt || null,

        lastLogin: dbUser?.lastLogin || null,

        emailVerified: Boolean(firebaseUser?.emailVerified),
      };
    },
    [normalizeEmail],
  );

  // ==========================================================
  // FIREBASE AUTH STATE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

      // ------------------------------------------------------
      // NO FIREBASE USER
      // ------------------------------------------------------

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const email = normalizeEmail(firebaseUser.email);

        if (!email) {
          throw new Error("Authenticated email not found.");
        }

        // ----------------------------------------------------
        // SAVE USER
        // ----------------------------------------------------

        await saveUserToDatabase(firebaseUser);

        if (!mounted) {
          return;
        }

        // ----------------------------------------------------
        // CREATE APPLICATION JWT
        // ----------------------------------------------------

        await createJWT(email);

        if (!mounted) {
          return;
        }

        // ----------------------------------------------------
        // GET DATABASE USER
        // ----------------------------------------------------

        const dbUser = await getCurrentUser();

        if (!mounted) {
          return;
        }

        // ----------------------------------------------------
        // SET APPLICATION USER
        // ----------------------------------------------------

        const applicationUser = buildUser(firebaseUser, dbUser);

        setUser(applicationUser);
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        if (!mounted) {
          return;
        }

        setUser(null);

        // ----------------------------------------------------
        // CLEAR SERVER COOKIE
        // ----------------------------------------------------

        try {
          await axiosPublic.post("/auth/logout");
        } catch (logoutError) {
          console.error("AUTH COOKIE LOGOUT ERROR:", logoutError);
        }

        // ----------------------------------------------------
        // CLEAR FIREBASE SESSION
        // ----------------------------------------------------

        try {
          await signOut(auth);
        } catch (firebaseError) {
          console.error("FIREBASE LOGOUT ERROR:", firebaseError);
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
  }, [
    normalizeEmail,
    saveUserToDatabase,
    createJWT,
    getCurrentUser,
    buildUser,
  ]);

  // ==========================================================
  // REFRESH USER
  // ==========================================================

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      return null;
    }

    try {
      // --------------------------------------------------------
      // Make sure Firebase user has an email
      // --------------------------------------------------------

      const email = normalizeEmail(auth.currentUser.email);

      if (!email) {
        throw new Error("Authenticated email not found.");
      }

      // --------------------------------------------------------
      // Get latest database user
      // --------------------------------------------------------

      const dbUser = await getCurrentUser();

      // --------------------------------------------------------
      // Build latest application user
      // --------------------------------------------------------

      const updatedUser = buildUser(auth.currentUser, dbUser);

      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error("REFRESH USER ERROR:", error);
      throw error;
    }
  }, [normalizeEmail, getCurrentUser, buildUser]);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const authInfo = useMemo(
    () => ({
      user,
      loading,

      createUser,
      loginUser,
      signInGoogle,
      signOutUser,

      updateUserProfile,

      refreshUser,
      clearUser,

      setUser,
    }),
    [
      user,
      loading,

      createUser,
      loginUser,
      signInGoogle,
      signOutUser,

      updateUserProfile,

      refreshUser,
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
