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

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

const AuthProvider = ({ children }) => {
  // ============================================================
  // STATE
  // ============================================================

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
      if (!firebaseUser?.uid) {
        throw new Error("Firebase user ID not found.");
      }

      if (!firebaseUser?.email) {
        throw new Error("User email not found.");
      }

      const email = normalizeEmail(firebaseUser.email);

      if (!email) {
        throw new Error("User email is required.");
      }

      const idToken = await firebaseUser.getIdToken();

      const payload = {
        uid: firebaseUser.uid,
        email,
        name: String(firebaseUser.displayName || "").trim(),
        photo: String(firebaseUser.photoURL || "").trim(),
        provider: firebaseUser.providerData?.[0]?.providerId || "password",
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
    [normalizeEmail],
  );

  // ============================================================
  // CREATE JWT
  // ============================================================

  const createJWT = useCallback(
    async (email) => {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        throw new Error("User email is required.");
      }

      const response = await axiosPublic.post(
        "/auth/jwt",
        {
          email: normalizedEmail,
        },
        {
          withCredentials: true,
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

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
  // GET CURRENT USER FROM SERVER
  // ============================================================

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

  // ============================================================
  // CREATE FIREBASE USER
  // ============================================================

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

  // ============================================================
  // LOGIN USER
  // ============================================================

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

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  const signInGoogle = useCallback(async () => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  // ============================================================
  // UPDATE FIREBASE PROFILE
  // ============================================================

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

      await updateProfile(currentUser, {
        displayName: cleanName,
        photoURL: cleanPhoto,
      });

      // Save updated Firebase profile to MongoDB.
      await saveUserToDatabase(currentUser);

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

  // ============================================================
  // CLEAR USER
  // ============================================================

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  // ============================================================
  // SIGN OUT
  // ============================================================

  const signOutUser = useCallback(async () => {
    try {
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

      await signOut(auth);

      setUser(null);
    } catch (error) {
      console.error("LOGOUT ERROR:", error);

      setUser(null);

      throw error;
    }
  }, []);

  // ============================================================
  // BUILD APPLICATION USER
  // ============================================================

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

        createdAt: dbUser?.createdAt || null,

        updatedAt: dbUser?.updatedAt || null,

        lastLogin: dbUser?.lastLogin || null,

        emailVerified: Boolean(firebaseUser?.emailVerified),
      };
    },
    [normalizeEmail],
  );

  // ============================================================
  // AUTH STATE LISTENER
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

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

        // Make sure Firebase user exists in MongoDB.
        await saveUserToDatabase(firebaseUser);

        if (!mounted) {
          return;
        }

        // Create server JWT cookie.
        await createJWT(email);

        if (!mounted) {
          return;
        }

        // Get final MongoDB user.
        const dbUser = await getCurrentUser();

        if (!mounted) {
          return;
        }

        const applicationUser = buildUser(firebaseUser, dbUser);

        setUser(applicationUser);
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        if (!mounted) {
          return;
        }

        setUser(null);

        // Clear server JWT.
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

        // Clear Firebase session.
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

  // ============================================================
  // REFRESH USER
  // ============================================================

  const refreshUser = useCallback(async () => {
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      setUser(null);
      return null;
    }

    try {
      const email = normalizeEmail(currentUser.email);

      if (!email) {
        throw new Error("Authenticated email not found.");
      }

      await createJWT(email);

      const dbUser = await getCurrentUser();

      const updatedUser = buildUser(currentUser, dbUser);

      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error("REFRESH USER ERROR:", error);

      throw error;
    }
  }, [normalizeEmail, createJWT, getCurrentUser, buildUser]);

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

      // IMPORTANT:
      // Register.jsx needs this function.
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

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
