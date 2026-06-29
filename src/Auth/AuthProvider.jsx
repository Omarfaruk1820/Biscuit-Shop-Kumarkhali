import { createContext, useEffect, useState } from "react";

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
import axiosPublic from "../api/axiosPublic";

export const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===========================
  // Register
  // ===========================

  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // ===========================
  // Login
  // ===========================

  const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ===========================
  // Google Login
  // ===========================

  const signInGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // ===========================
  // Update Profile
  // ===========================

  const updateUserProfile = (name, photo) => {
    return updateProfile(auth.currentUser, {
      displayName: name,
      photoURL: photo,
    });
  };

  // ===========================
  // Logout
  // ===========================

  const signOutUser = async () => {
    try {
      await axiosPublic.post("/logout");

      setUser(null);
      setRole(null);

      return signOut(auth);
    } catch (error) {
      console.error(error);

      return signOut(auth);
    }
  };

  // ===========================
  // Auth State
  // ===========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setLoading(true);

        if (!currentUser) {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const userInfo = {
          uid: currentUser.uid,
          name: currentUser.displayName || "",
          email: currentUser.email.toLowerCase().trim(),
          photo: currentUser.photoURL || "",
          provider: currentUser.providerData?.[0]?.providerId || "password",
        };

        setUser(userInfo);

        // Save user
        await axiosPublic.post("/users", userInfo);

        // Create JWT Cookie
        const jwtRes = await axiosPublic.post("/jwt", {
          email: userInfo.email,
        });

        setRole(jwtRes.data.role);
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ===========================
  // Context
  // ===========================

  const authInfo = {
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
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
