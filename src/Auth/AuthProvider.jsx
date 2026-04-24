import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import auth from "./firebase.config";

export const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= CREATE USER =================
  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // ================= LOGIN =================
  const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ================= GOOGLE LOGIN =================
  const signInGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // ================= LOGOUT =================
  const signOutUser = () => {
    return signOut(auth);
  };

  // ================= AUTH STATE OBSERVER (FIXED) =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email?.toLowerCase().trim(),
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }

      // 🔥 IMPORTANT: always stop loading after first check
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= CONTEXT VALUE =================
  const value = {
    user,
    loading,
    createUser,
    loginUser,
    signOutUser,
    signInGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;