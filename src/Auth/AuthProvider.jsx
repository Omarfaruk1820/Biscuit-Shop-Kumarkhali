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

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // NORMALIZE EMAIL
  // ============================================================

  const normalizeEmail = useCallback((email = "") => {
    return String(email).trim().toLowerCase();
  }, []);

  // ============================================================
  // SAVE USER TO DATABASE
  // ============================================================

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

      const response = await axiosPublic.post("/users", payload);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to save authenticated user.",
        );
      }

      return response.data;
    },
    [normalizeEmail],
  );

  // ============================================================
  // CREATE JWT
  // ============================================================

  const createJWT = useCallback(
    async (email) => {
      const response = await axiosPublic.post("/auth/jwt", {
        email: normalizeEmail(email),
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

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  const getCurrentUser = useCallback(async () => {
    const response = await axiosPublic.get("/auth/me");

    if (!response.data?.success || !response.data?.user) {
      throw new Error(
        response.data?.message || "Failed to load authenticated user.",
      );
    }

    return response.data.user;
  }, []);

  // ============================================================
  // CREATE USER
  // ============================================================

  const createUser = useCallback(
    async (email, password) => {
      const normalizedEmail = normalizeEmail(email);

      return createUserWithEmailAndPassword(auth, normalizedEmail, password);
    },
    [normalizeEmail],
  );

  // ============================================================
  // LOGIN USER
  // ============================================================

  const loginUser = useCallback(
    async (email, password) => {
      const normalizedEmail = normalizeEmail(email);

      return signInWithEmailAndPassword(auth, normalizedEmail, password);
    },
    [normalizeEmail],
  );

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  const signInGoogle = useCallback(async () => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

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

  // ============================================================
  // CLEAR USER
  // ============================================================

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const signOutUser = useCallback(async () => {
    try {
      try {
        await axiosPublic.post("/auth/logout");
      } catch (error) {
        console.error("Logout API Error:", error);
      }

      clearUser();

      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  }, [clearUser]);

  // ============================================================
  // AUTH STATE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

      // --------------------------------------------------------
      // NO FIREBASE USER
      // --------------------------------------------------------

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

        // ------------------------------------------------------
        // SAVE USER + CREATE JWT IN PARALLEL
        // ------------------------------------------------------

        await Promise.all([saveUserToDatabase(firebaseUser), createJWT(email)]);

        if (!mounted) {
          return;
        }

        // ------------------------------------------------------
        // GET DATABASE USER
        // JWT cookie already exists now.
        // ------------------------------------------------------

        const dbUser = await getCurrentUser();

        if (!mounted) {
          return;
        }

        // ------------------------------------------------------
        // SET USER
        // ------------------------------------------------------

        setUser({
          uid: firebaseUser.uid,

          name: dbUser?.name || "",

          email: dbUser?.email || normalizeEmail(firebaseUser.email),

          photo: dbUser?.photo || "",

          role: dbUser?.role || "customer",

          status: dbUser?.status || "active",

          provider:
            dbUser?.provider ||
            firebaseUser.providerData?.[0]?.providerId ||
            "password",

          createdAt: dbUser?.createdAt,

          updatedAt: dbUser?.updatedAt,

          lastLogin: dbUser?.lastLogin,

          emailVerified: firebaseUser.emailVerified,
        });
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        if (!mounted) {
          return;
        }

        setUser(null);

        try {
          await axiosPublic.post("/auth/logout");
        } catch (logoutError) {
          console.error("AUTH COOKIE LOGOUT ERROR:", logoutError);
        }

        try {
          await signOut(auth);
        } catch (firebaseLogoutError) {
          console.error("FIREBASE LOGOUT ERROR:", firebaseLogoutError);
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
  }, [normalizeEmail, saveUserToDatabase, createJWT, getCurrentUser]);

  // ============================================================
  // REFRESH USER
  // ============================================================

  const refreshUser = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        clearUser();
        return null;
      }

      const dbUser = await getCurrentUser();

      const updatedUser = {
        uid: auth.currentUser.uid,

        name: dbUser?.name || "",

        email: dbUser?.email || normalizeEmail(auth.currentUser.email),

        photo: dbUser?.photo || "",

        role: dbUser?.role || "customer",

        status: dbUser?.status || "active",

        provider:
          dbUser?.provider ||
          auth.currentUser.providerData?.[0]?.providerId ||
          "password",

        createdAt: dbUser?.createdAt,

        updatedAt: dbUser?.updatedAt,

        lastLogin: dbUser?.lastLogin,

        emailVerified: auth.currentUser.emailVerified,
      };

      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error("REFRESH USER ERROR:", error);
      throw error;
    }
  }, [clearUser, getCurrentUser, normalizeEmail]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

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

  // ============================================================
  // PROVIDER
  // ============================================================

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
