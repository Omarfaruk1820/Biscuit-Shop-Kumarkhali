// ======================================================
// AuthProvider.jsx
// Part 1
// Imports, Context, Google Provider, State,
// Firebase Methods, Logout
// ======================================================

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";

import auth from "./firebase.config";
import axiosPublic from "../hooks/axiosPublic";

// ======================================================
// Auth Context
// ======================================================

export const AuthContext = createContext(null);

// ======================================================
// Google Provider
// ======================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ======================================================
// Auth Provider
// ======================================================

const AuthProvider = ({ children }) => {
  // ======================================================
  // State
  // ======================================================

  const [user, setUser] = useState(null);

  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);

  // ======================================================
  // Register User
  // ======================================================

  const createUser = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    return createUserWithEmailAndPassword(auth, normalizedEmail, password);
  }, []);

  // ======================================================
  // Login User
  // ======================================================

  const loginUser = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    return signInWithEmailAndPassword(auth, normalizedEmail, password);
  }, []);

  // ======================================================
  // Google Sign In
  // ======================================================

  const signInGoogle = useCallback(async () => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  // ======================================================
  // Update Firebase Profile
  // ======================================================

  const updateUserProfile = useCallback(async (name, photo = "") => {
    if (!auth.currentUser) {
      throw new Error("Authenticated user not found.");
    }

    return updateProfile(auth.currentUser, {
      displayName: name.trim(),
      photoURL: photo,
    });
  }, []);

  // ======================================================
  // Logout User
  // ======================================================

  const signOutUser = useCallback(async () => {
    try {
      // Remove JWT Cookie from Server
      await axiosPublic.post("/auth/logout");
    } catch (error) {
      console.error("Logout API Error:", error);
    } finally {
      // Clear Local State
      setUser(null);
      setRole(null);

      // Logout Firebase
      await signOut(auth);
    }
  }, []);

  // ======================================================
  // Part 2 starts from here...
  // onAuthStateChanged()
  // ======================================================
  // ======================================================
  // Auth State
  // Firebase → MongoDB → JWT → Auth User Sync
  // ======================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      try {
        // ==========================================
        // User Logged Out
        // ==========================================

        if (!currentUser) {
          setUser(null);
          setRole(null);

          try {
            await axiosPublic.post("/auth/logout");
          } catch (error) {
            console.error("Logout API Error:", error);
          }

          return;
        }

        // ==========================================
        // Validate Email
        // ==========================================

        const email = currentUser.email?.trim().toLowerCase();

        if (!email) {
          throw new Error("Authenticated user email not found.");
        }

        // ==========================================
        // Prepare User Information
        // ==========================================

        const userInfo = {
          uid: currentUser.uid,
          name: currentUser.displayName || "",
          email,
          photo: currentUser.photoURL || "",
          provider: currentUser.providerData?.[0]?.providerId || "password",
          emailVerified: currentUser.emailVerified,
        };

        // ==========================================
        // Save / Update User in MongoDB
        // POST /users
        // ==========================================

        const saveUserRes = await axiosPublic.post("/users", userInfo);

        if (!saveUserRes.data?.success) {
          throw new Error(
            saveUserRes.data?.message || "Failed to save user information.",
          );
        }

        // ==========================================
        // Generate JWT Cookie
        // POST /auth/jwt
        // ==========================================

        const jwtRes = await axiosPublic.post("/auth/jwt", {
          email,
        });

        if (!jwtRes.data?.success) {
          throw new Error(
            jwtRes.data?.message || "Failed to generate JWT token.",
          );
        }

        // ==========================================
        // Get Logged-in User
        // GET /auth/me
        // ==========================================

        const meRes = await axiosPublic.get("/auth/me");

        if (!meRes.data?.success) {
          throw new Error(
            meRes.data?.message || "Failed to fetch authenticated user.",
          );
        }

        const dbUser = meRes.data.user;

        // ==========================================
        // Update Context State
        // ==========================================

        setUser({
          uid: currentUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          photo: dbUser.photo,
          provider: dbUser.provider,
          role: dbUser.role,
          status: dbUser.status,
          emailVerified: currentUser.emailVerified,
          createdAt: dbUser.createdAt,
        });

        setRole(dbUser.role);
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        if (error.response) {
          console.error("Server Response:", error.response.data);
        }

        setUser(null);
        setRole(null);

        try {
          await axiosPublic.post("/auth/logout");
        } catch (logoutError) {
          console.error("Logout API Error:", logoutError);
        }

        try {
          await signOut(auth);
        } catch (firebaseError) {
          console.error("Firebase Logout Error:", firebaseError);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  // ======================================================
  // Context Value
  // ======================================================

  const authInfo = useMemo(
    () => ({
      // ==========================
      // State
      // ==========================
      user,
      role,
      loading,

      // ==========================
      // Firebase Methods
      // ==========================
      createUser,
      loginUser,
      signInGoogle,
      updateUserProfile,
      signOutUser,

      // ==========================
      // State Setters
      // (Useful for Admin Dashboard /
      // Profile Update if needed)
      // ==========================
      setUser,
      setRole,
    }),
    [
      user,
      role,
      loading,

      createUser,
      loginUser,
      signInGoogle,
      updateUserProfile,
      signOutUser,
    ],
  );

  // ======================================================
  // Provider
  // ======================================================

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
