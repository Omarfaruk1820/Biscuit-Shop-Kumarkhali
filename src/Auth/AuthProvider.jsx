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
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";

import auth from "./firebase.config";
import axiosPublic from "../hooks/axiosPublic";

export const AuthContext = createContext(null);

/* ==========================================================
   GOOGLE PROVIDER
========================================================== */

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

/* ==========================================================
   AUTH PROVIDER
========================================================== */

const AuthProvider = ({ children }) => {
  /* ==========================================================
     STATE
  ========================================================== */

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ==========================================================
     REFS
  ========================================================== */

  // Prevent duplicate initialization (React Strict Mode)

  const initializedRef = useRef(false);

  /* ==========================================================
     HELPER
  ========================================================== */

  const normalizeEmail = useCallback((email = "") => {
    return String(email).trim().toLowerCase();
  }, []);

  /* ==========================================================
     SAVE / UPDATE USER
  ========================================================== */

  const saveUserToDatabase = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser?.email) {
        throw new Error("User email not found.");
      }

      const payload = {
        name: firebaseUser.displayName || "",

        email: normalizeEmail(firebaseUser.email),

        photo: firebaseUser.photoURL || "",

        provider: firebaseUser.providerData?.[0]?.providerId || "password",

        emailVerified: firebaseUser.emailVerified,
      };

      const { data } = await axiosPublic.post("/users", payload);

      if (!data?.success) {
        throw new Error(data?.message || "Failed to save authenticated user.");
      }

      return data;
    },
    [normalizeEmail],
  );

  /* ==========================================================
     GENERATE JWT COOKIE
  ========================================================== */

  const createJWT = useCallback(
    async (email) => {
      const { data } = await axiosPublic.post("/auth/jwt", {
        email: normalizeEmail(email),
      });

      if (!data?.success) {
        throw new Error(
          data?.message || "Failed to generate authentication token.",
        );
      }

      return data;
    },
    [normalizeEmail],
  );

  /* ==========================================================
     LOAD CURRENT USER
  ========================================================== */

  const getCurrentUser = useCallback(async () => {
    const { data } = await axiosPublic.get("/auth/me");

    if (!data?.success || !data?.user) {
      throw new Error(data?.message || "Failed to load authenticated user.");
    }

    return data.user;
  }, []);

  /* ==========================================================
     CLEAR USER
  ========================================================== */

  const clearUser = useCallback(() => {
    initializedRef.current = false;
    setUser(null);
  }, []);
  /* ==========================================================
     REGISTER
  ========================================================== */

  const createUser = useCallback(
    async (email, password) => {
      const normalizedEmail = normalizeEmail(email);

      const credential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      return credential;
    },
    [normalizeEmail],
  );

  /* ==========================================================
     LOGIN
  ========================================================== */

  const loginUser = useCallback(
    async (email, password) => {
      const normalizedEmail = normalizeEmail(email);

      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      return credential;
    },
    [normalizeEmail],
  );

  /* ==========================================================
     GOOGLE SIGN IN
  ========================================================== */

  const signInGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider);

    return credential;
  }, []);

  /* ==========================================================
     UPDATE PROFILE
  ========================================================== */

  const updateUserProfile = useCallback(async (name, photo = "") => {
    if (!auth.currentUser) {
      throw new Error("Authenticated user not found.");
    }

    await updateProfile(auth.currentUser, {
      displayName: String(name).trim(),
      photoURL: photo || "",
    });

    // Update local state immediately
    setUser((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        name: String(name).trim(),
        photo: photo || "",
      };
    });

    return auth.currentUser;
  }, []);

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const signOutUser = useCallback(async () => {
    try {
      // Remove JWT Cookie
      try {
        await axiosPublic.post("/auth/logout");
      } catch (error) {
        console.error("Logout API Error:", error);
      }

      // Reset local state
      clearUser();

      // Firebase Logout
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  }, [clearUser]);
  /* ==========================================================
     AUTH STATE LISTENER
     (Production Ready)
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      /* ----------------------------------------
           Logged Out
        ---------------------------------------- */

      if (!firebaseUser) {
        clearUser();

        if (mounted) {
          setLoading(false);
        }

        return;
      }

      /* ----------------------------------------
           Prevent duplicate initialization
           (React Strict Mode)
        ---------------------------------------- */

      if (initializedRef.current) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      initializedRef.current = true;

      if (mounted) {
        setLoading(true);
      }

      try {
        /* ----------------------------------------
             Validate Email
          ---------------------------------------- */

        const email = normalizeEmail(firebaseUser.email);

        if (!email) {
          throw new Error("Authenticated email not found.");
        }

        /* ----------------------------------------
             Save / Update User
          ---------------------------------------- */

        await saveUserToDatabase(firebaseUser);

        /* ----------------------------------------
             Generate JWT Cookie
          ---------------------------------------- */

        await createJWT(email);

        /* ----------------------------------------
             Load Current User
          ---------------------------------------- */

        const dbUser = await getCurrentUser();

        if (!mounted) return;

        /* ----------------------------------------
             Update Context
          ---------------------------------------- */

        setUser({
          uid: firebaseUser.uid,

          name: dbUser.name,

          email: dbUser.email,

          photo: dbUser.photo,

          role: dbUser.role,

          status: dbUser.status,

          provider: dbUser.provider,

          createdAt: dbUser.createdAt,

          updatedAt: dbUser.updatedAt,

          lastLogin: dbUser.lastLogin,

          emailVerified: firebaseUser.emailVerified,
        });
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        initializedRef.current = false;

        if (mounted) {
          setUser(null);
        }

        try {
          await axiosPublic.post("/auth/logout");
        } catch (_) {}

        try {
          await signOut(auth);
        } catch (_) {}
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
    clearUser,
  ]);
  /* ==========================================================
     REFRESH USER
  ========================================================== */

  const refreshUser = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        clearUser();
        return null;
      }

      const dbUser = await getCurrentUser();

      const updatedUser = {
        uid: auth.currentUser.uid,

        name: dbUser.name,

        email: dbUser.email,

        photo: dbUser.photo,

        role: dbUser.role,

        status: dbUser.status,

        provider: dbUser.provider,

        createdAt: dbUser.createdAt,

        updatedAt: dbUser.updatedAt,

        lastLogin: dbUser.lastLogin,

        emailVerified: auth.currentUser.emailVerified,
      };

      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error("REFRESH USER ERROR:", error);
      throw error;
    }
  }, [clearUser, getCurrentUser]);

  /* ==========================================================
     AUTH CONTEXT VALUE
  ========================================================== */

  const authInfo = useMemo(
    () => ({
      // State
      user,
      loading,

      // Authentication
      createUser,
      loginUser,
      signInGoogle,
      signOutUser,
      updateUserProfile,

      // Helpers
      refreshUser,
      clearUser,

      // Manual Setter
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

  /* ==========================================================
     PROVIDER
  ========================================================== */

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
