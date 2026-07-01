import { useContext, useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

const GoogleSignIn = () => {
  // ======================================================
  // Context
  // ======================================================

  const { signInGoogle } = useContext(AuthContext);

  const { addToast } = useToast();

  // ======================================================
  // Loading
  // ======================================================

  const [loading, setLoading] = useState(false);

  // ======================================================
  // Google Login
  // ======================================================

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await signInGoogle();

      // AuthProvider automatically:
      // ✔ POST /users
      // ✔ POST /auth/jwt
      // ✔ GET /auth/me
      // ✔ MongoDB Sync
      // ✔ JWT Cookie
      // ✔ Role Sync
      // ✔ User State

      addToast("Welcome 🎉", "success");
    } catch (error) {
      console.error("Google Login:", error);

      let message = "Google Sign-In failed.";

      switch (error.code) {
        case "auth/popup-closed-by-user":
          message = "Google sign-in was cancelled.";
          break;

        case "auth/popup-blocked":
          message = "Popup blocked by browser.";
          break;

        case "auth/network-request-failed":
          message = "Network error.";
          break;

        case "auth/too-many-requests":
          message = "Too many attempts. Try again later.";
          break;

        default:
          message = error.message || message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="btn btn-outline w-full"
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          Signing in...
        </>
      ) : (
        <>
          <FcGoogle className="text-xl" />
          Continue with Google
        </>
      )}
    </button>
  );
};

export default GoogleSignIn;
