/* ==========================================================
   IMPORTS
========================================================== */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

/* ==========================================================
   AUTH CONTEXT
========================================================== */
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
     AUTH STATE
  ========================================================== */

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  /*
    Prevent duplicate auth initialization
  */

  const initialized = useRef(false);

  /* ==========================================================
     CREATE USER
  ========================================================== */

  const createUser = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    return createUserWithEmailAndPassword(auth, normalizedEmail, password);
  }, []);

  /* ==========================================================
     LOGIN USER
  ========================================================== */

  const loginUser = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    return signInWithEmailAndPassword(auth, normalizedEmail, password);
  }, []);

  /* ==========================================================
     GOOGLE SIGN IN
  ========================================================== */

  const signInGoogle = useCallback(async () => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  /* ==========================================================
     UPDATE PROFILE
  ========================================================== */

  const updateUserProfile = useCallback(async (name, photo = "") => {
    if (!auth.currentUser) {
      throw new Error("Authenticated user not found.");
    }

    return updateProfile(auth.currentUser, {
      displayName: name.trim(),
      photoURL: photo,
    });
  }, []);

  /* ==========================================================
     LOGOUT USER
  ========================================================== */

  const signOutUser = useCallback(async () => {
    try {
      await axiosPublic.post("/auth/logout");
    } catch (error) {
      console.error("Logout API Error:", error);
    } finally {
      initialized.current = false;

      setUser(null);

      await signOut(auth);
    }
  }, []);

  /* ==========================================================
     PART 2 STARTS FROM HERE
     (onAuthStateChanged)
  ========================================================== */
  /* ==========================================================
   AUTH STATE OBSERVER
   (ULTRA OPTIMIZED)
========================================================== */

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      /*
    -----------------------------------
    User Logged Out
    -----------------------------------
    */

      if (!currentUser) {
        initialized.current = false;

        if (isMounted) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      /*
    -----------------------------------
    Prevent Duplicate Initialization
    -----------------------------------
    */

      if (initialized.current) {
        if (isMounted) {
          setLoading(false);
        }

        return;
      }

      initialized.current = true;

      /*
    -----------------------------------
    Initial Loading
    -----------------------------------
    */

      if (isMounted) {
        setLoading(true);
      }

      try {
        /*
      -----------------------------------
      Normalize Email
      -----------------------------------
      */

        const email = currentUser.email?.trim().toLowerCase();

        if (!email) {
          throw new Error("Authenticated user email not found.");
        }

        /*
      -----------------------------------
      Generate JWT Cookie

      NOTE:
      If Login/Register already calls
      /auth/jwt,
      remove this request.
      -----------------------------------
      */

        const jwtRes = await axiosPublic.post("/auth/jwt", {
          email,
        });

        if (!jwtRes.data?.success) {
          throw new Error(
            jwtRes.data?.message || "Failed to generate authentication token.",
          );
        }

        /*
      -----------------------------------
      Load Current User
      -----------------------------------
      */

        const { data } = await axiosPublic.get("/auth/me");

        if (!data?.success) {
          throw new Error(
            data?.message || "Failed to load authenticated user.",
          );
        }

        const dbUser = data.user;

        /*
      -----------------------------------
      Update Context
      -----------------------------------
      */

        if (!isMounted) return;

        setUser({
          uid: currentUser.uid,

          name: dbUser.name,

          email: dbUser.email,

          photo: dbUser.photo,

          provider: dbUser.provider,

          role: dbUser.role,

          status: dbUser.status,

          createdAt: dbUser.createdAt,

          emailVerified: currentUser.emailVerified,
        });
      } catch (error) {
        console.error("AUTH STATE ERROR:", error);

        initialized.current = false;

        if (isMounted) {
          setUser(null);
        }

        /*
      -----------------------------------
      Cleanup Authentication
      -----------------------------------
      */

        await Promise.allSettled([
          axiosPublic.post("/auth/logout"),

          signOut(auth),
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;

      unsubscribe();
    };
  }, []);
  /* ==========================================================
   AUTH CONTEXT VALUE
========================================================== */

  const authInfo = useMemo(
    () => ({
      /* ----------------------------------------
       Authentication State
    ---------------------------------------- */

      user,

      loading,

      /* ----------------------------------------
       Authentication Methods
    ---------------------------------------- */

      createUser,

      loginUser,

      signInGoogle,

      updateUserProfile,

      signOutUser,

      /* ----------------------------------------
       State Updaters
    ---------------------------------------- */

      setUser,
    }),
    [
      user,
      loading,

      createUser,
      loginUser,
      signInGoogle,
      updateUserProfile,
      signOutUser,
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
