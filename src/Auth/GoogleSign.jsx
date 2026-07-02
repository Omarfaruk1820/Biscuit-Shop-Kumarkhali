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
  // Loading State
  // ======================================================

  const [loading, setLoading] = useState(false);

  // ======================================================
  // Google Login
  // ======================================================

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Firebase Login
      await signInGoogle();

      // Don't Navigate
      // Don't Set User
      // Don't Set Role
      // AuthProvider will handle everything.
    } catch (error) {
      console.error("Google Sign-In Error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        return;
      }

      let message = "Google Sign-In failed.";

      switch (error.code) {
        case "auth/popup-blocked":
          message = "Popup blocked by browser.";
          break;

        case "auth/network-request-failed":
          message = "Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;

        case "auth/account-exists-with-different-credential":
          message =
            "This email is already registered with another sign-in method.";
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
      className="btn btn-outline w-full gap-3"
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          Signing in...
        </>
      ) : (
        <>
          <FcGoogle size={22} />
          Continue with Google
        </>
      )}
    </button>
  );
};

export default GoogleSignIn;
