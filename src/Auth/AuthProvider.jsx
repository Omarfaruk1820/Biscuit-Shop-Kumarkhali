// ===============================
// AuthProvider.jsx
// Part 1: Imports, Context, State, Firebase Methods
// ===============================

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
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import auth from "./firebase.config";
import axiosPublic from "../hooks/axiosPublic";

// ======================================================
// Context
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
// Provider
// ======================================================

const AuthProvider = ({ children }) => {
  // ======================================================
  // States
  // ======================================================

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======================================================
  // Register
  // ======================================================

  const createUser = useCallback((email, password) => {
    return createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );
  }, []);

  // ======================================================
  // Login
  // ======================================================

  const loginUser = useCallback((email, password) => {
    return signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );
  }, []);

  // ======================================================
  // Google Login
  // ======================================================

  const signInGoogle = useCallback(() => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  // ======================================================
  // Update Profile
  // ======================================================

  const updateUserProfile = useCallback(async (name, photo = "") => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found.");
    }

    return updateProfile(auth.currentUser, {
      displayName: name.trim(),
      photoURL: photo,
    });
  }, []);

  // ======================================================
  // Logout
  // ======================================================

  const signOutUser = useCallback(async () => {
    try {
      // Remove JWT Cookie from Server
      await axiosPublic.post("/logout");
    } catch (error) {
      console.error("Logout API Error:", error);
    } finally {
      // Always clear local state
      setUser(null);
      setRole(null);

      // Always logout Firebase
      await signOut(auth);
    }
  }, []);

  // ======================================================
  // Auth State (Part 2)
  // ======================================================

  // useEffect(() => {
  //   // Part 2 starts here...
  // }, []);
  // ======================================================
// Auth State
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
      // Prepare User Data
      // ==========================================

      const userInfo = {
        uid: currentUser.uid,
        name: currentUser.displayName || "",
        email,
        photo: currentUser.photoURL || "",
        provider:
          currentUser.providerData?.[0]?.providerId || "password",
        emailVerified: currentUser.emailVerified,
      };

      // ==========================================
      // Save / Update User
      // ==========================================

      const saveUserRes = await axiosPublic.post("/users", userInfo);

      if (!saveUserRes.data?.success) {
        throw new Error(
          saveUserRes.data?.message || "Failed to save user."
        );
      }

      // ==========================================
      // Generate JWT Cookie
      // ==========================================

      const jwtRes = await axiosPublic.post("/jwt", {
        email,
      });

      if (!jwtRes.data?.success) {
        throw new Error(
          jwtRes.data?.message || "JWT generation failed."
        );
      }

      // ==========================================
      // Update State
      // ==========================================

      setUser(userInfo);

      setRole(jwtRes.data.role || "user");
    } catch (error) {
      console.error("AUTH STATE ERROR:", error);

      // ==========================================
      // Clear State
      // ==========================================

      setUser(null);
      setRole(null);

      // ==========================================
      // Logout Firebase
      // ==========================================

      try {
        await axiosPublic.post("/logout");
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
  // Context Value (Part 3)
  // ======================================================

  const authInfo = useMemo(
    () => ({
      user,
      role,
      loading,

      createUser,
      loginUser,
      signInGoogle,
      updateUserProfile,
      signOutUser,

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
  // Provider (Part 3)
  // ======================================================

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
