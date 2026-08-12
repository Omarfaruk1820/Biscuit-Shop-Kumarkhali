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
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
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
  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // NORMALIZE EMAIL
  // ==========================================================

  const normalizeEmail = useCallback((email = "") => {
    return String(email).trim().toLowerCase();
  }, []);

  // ==========================================================
  // GET FIREBASE ID TOKEN
  // ==========================================================

  const getFirebaseIdToken = useCallback(
    async (firebaseUser, forceRefresh = false) => {
      if (!firebaseUser?.uid) {
        throw new Error("Firebase user is not available.");
      }

      const token = await firebaseUser.getIdToken(forceRefresh);

      if (!token || typeof token !== "string") {
        throw new Error("Failed to get Firebase authentication token.");
      }

      return token;
    },
    [],
  );

  // ==========================================================
  // SAVE / SYNC USER WITH MONGODB
  //
  // Firebase User
  //      ↓
  // Firebase ID Token
  //      ↓
  // POST /users
  // ==========================================================

  const saveUserToDatabase = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser?.uid) {
        throw new Error("Firebase user ID not found.");
      }

      const email = normalizeEmail(firebaseUser.email);

      if (!email) {
        throw new Error("Firebase user email not found.");
      }

      const idToken = await getFirebaseIdToken(firebaseUser);

      const provider = firebaseUser.providerData?.[0]?.providerId || "password";

      const payload = {
        uid: firebaseUser.uid,
        email,
        name: String(firebaseUser.displayName || "").trim(),
        photo: String(firebaseUser.photoURL || "").trim(),
        provider,
        emailVerified: Boolean(firebaseUser.emailVerified),
      };

      const response = await axiosPublic.post("/users", payload, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
        timeout: 15000,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to save user.");
      }

      return response.data;
    },
    [normalizeEmail, getFirebaseIdToken],
  );

  // ==========================================================
  // CREATE APPLICATION JWT
  //
  // Firebase ID Token
  //      ↓
  // POST /auth/jwt
  //      ↓
  // HTTP-only Cookie
  // ==========================================================

  const createJWT = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser?.uid) {
        throw new Error("Firebase user is not available.");
      }

      const idToken = await getFirebaseIdToken(firebaseUser);

      const response = await axiosPublic.post(
        "/auth/jwt",
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 15000,
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to create authentication session.",
        );
      }

      return response.data;
    },
    [getFirebaseIdToken],
  );

  // ==========================================================
  // GET CURRENT APPLICATION USER
  //
  // Application JWT Cookie
  //      ↓
  // GET /auth/me
  // ==========================================================

  const getCurrentUser = useCallback(async () => {
    const response = await axiosPublic.get("/auth/me", {
      withCredentials: true,
      timeout: 15000,
    });

    if (!response.data?.success || !response.data?.user) {
      throw new Error(
        response.data?.message || "Failed to load authenticated user.",
      );
    }

    return response.data.user;
  }, []);

  // ==========================================================
  // CREATE FIREBASE USER
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
  //
  // Firebase profile
  //      ↓
  // MongoDB user
  //      ↓
  // Local state
  // ==========================================================

  const updateUserProfile = useCallback(
    async (name, photo = "") => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Authenticated user not found.");
      }

      const cleanName = String(name || "").trim();
      const cleanPhoto = String(photo || "").trim();

      if (!cleanName) {
        throw new Error("Name is required.");
      }

      // --------------------------------------------------------
      // UPDATE FIREBASE PROFILE
      // --------------------------------------------------------

      await updateProfile(currentUser, {
        displayName: cleanName,
        photoURL: cleanPhoto,
      });

      // --------------------------------------------------------
      // SYNC MONGODB
      // --------------------------------------------------------

      await saveUserToDatabase(currentUser);

      // --------------------------------------------------------
      // UPDATE LOCAL STATE
      // --------------------------------------------------------

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

      return currentUser;
    },
    [saveUserToDatabase],
  );

  // ==========================================================
  // CLEAR USER
  // ==========================================================

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  // ==========================================================
  // SIGN OUT
  //
  // Server JWT Cookie
  //      ↓
  // /auth/logout
  //
  // Firebase Session
  //      ↓
  // Firebase signOut
  // ==========================================================

  const signOutUser = useCallback(async () => {
    try {
      // --------------------------------------------------------
      // CLEAR SERVER COOKIE
      // --------------------------------------------------------

      try {
        await axiosPublic.post(
          "/auth/logout",
          {},
          {
            withCredentials: true,
            timeout: 10000,
          },
        );
      } catch (serverError) {
        console.error("SERVER LOGOUT ERROR:", serverError);
      }

      // --------------------------------------------------------
      // CLEAR FIREBASE SESSION
      // --------------------------------------------------------

      await signOut(auth);

      // --------------------------------------------------------
      // CLEAR LOCAL STATE
      // --------------------------------------------------------

      setUser(null);
    } catch (error) {
      console.error("LOGOUT ERROR:", error);

      setUser(null);

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

        role: dbUser?.role || "user",

        status: dbUser?.status || "active",

        provider:
          dbUser?.provider ||
          firebaseUser?.providerData?.[0]?.providerId ||
          "password",

        emailVerified:
          Boolean(firebaseUser?.emailVerified) ||
          Boolean(dbUser?.emailVerified),

        createdAt: dbUser?.createdAt || null,

        updatedAt: dbUser?.updatedAt || null,

        lastLogin: dbUser?.lastLogin || null,
      };
    },
    [normalizeEmail],
  );

  // ==========================================================
  // AUTH STATE LISTENER
  //
  // Firebase Auth
  //      ↓
  // POST /users
  //      ↓
  // POST /auth/jwt
  //      ↓
  // GET /auth/me
  //      ↓
  // Application User
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
        // ----------------------------------------------------
        // VALIDATE EMAIL
        // ----------------------------------------------------

        const email = normalizeEmail(firebaseUser.email);

        if (!email) {
          throw new Error("Authenticated email not found.");
        }

        // ----------------------------------------------------
        // SAVE / SYNC USER
        // ----------------------------------------------------

        await saveUserToDatabase(firebaseUser);

        if (!mounted) {
          return;
        }

        // ----------------------------------------------------
        // CREATE APPLICATION JWT
        // ----------------------------------------------------

        await createJWT(firebaseUser);

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
        // BUILD APPLICATION USER
        // ----------------------------------------------------

        const applicationUser = buildUser(firebaseUser, dbUser);

        setUser(applicationUser);
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        if (!mounted) {
          return;
        }

        // ----------------------------------------------------
        // CLEAR APPLICATION USER
        // ----------------------------------------------------

        setUser(null);

        // ----------------------------------------------------
        // CLEAR SERVER COOKIE
        // ----------------------------------------------------

        try {
          await axiosPublic.post(
            "/auth/logout",
            {},
            {
              withCredentials: true,
              timeout: 10000,
            },
          );
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
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setUser(null);
      return null;
    }

    try {
      // --------------------------------------------------------
      // REFRESH FIREBASE TOKEN
      // --------------------------------------------------------

      await getFirebaseIdToken(currentUser, true);

      // --------------------------------------------------------
      // CREATE / REFRESH SERVER JWT
      // --------------------------------------------------------

      await createJWT(currentUser);

      // --------------------------------------------------------
      // GET SERVER USER
      // --------------------------------------------------------

      const dbUser = await getCurrentUser();

      // --------------------------------------------------------
      // BUILD APPLICATION USER
      // --------------------------------------------------------

      const updatedUser = buildUser(currentUser, dbUser);

      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error("REFRESH USER ERROR:", error);

      throw error;
    }
  }, [getFirebaseIdToken, createJWT, getCurrentUser, buildUser]);

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

      saveUserToDatabase,

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
      saveUserToDatabase,
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
