import { useContext, useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

const GoogleSignIn = () => {
  const { signInGoogle, loading: authLoading } = useContext(AuthContext);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);

  const isLoading = loading || authLoading;

  const handleGoogleLogin = async () => {
    if (isLoading) {
      return;
    }

    setLoading(true);

    try {
      // Firebase Google authentication.
      //
      // AuthProvider's onAuthStateChanged() will automatically:
      //
      // Firebase User
      //      ↓
      // Save / sync user to MongoDB
      //      ↓
      // Create application JWT
      //      ↓
      // GET /auth/me
      //      ↓
      // Set application user
      //
      // Therefore, this component does NOT:
      // - save the user to MongoDB
      // - create JWT
      // - set user
      // - navigate
      await signInGoogle();

      addToast("Google sign-in successful!", "success");
    } catch (error) {
      console.error("GOOGLE SIGN-IN ERROR:", error);

      // User closed the popup.
      if (error?.code === "auth/popup-closed-by-user") {
        return;
      }

      let message = "Google sign-in failed. Please try again.";

      switch (error?.code) {
        case "auth/popup-blocked":
          message =
            "Google sign-in popup was blocked. Please allow popups for this site.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection and try again.";
          break;

        case "auth/too-many-requests":
          message = "Too many sign-in attempts. Please try again later.";
          break;

        case "auth/account-exists-with-different-credential":
          message =
            "This email is already registered with another sign-in method.";
          break;

        case "auth/cancelled-popup-request":
          message = "Another Google sign-in request is already in progress.";
          break;

        case "auth/operation-not-allowed":
          message =
            "Google sign-in is currently disabled. Please contact support.";
          break;

        case "auth/user-disabled":
          message = "This account has been disabled.";
          break;

        default:
          if (error?.response?.data?.message) {
            message = error.response.data.message;
          } else if (error?.message) {
            message = error.message;
          }
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
      disabled={isLoading}
      className="btn btn-outline w-full gap-3"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span
            className="loading loading-spinner loading-sm"
            aria-hidden="true"
          />
          Signing in...
        </>
      ) : (
        <>
          <FcGoogle size={22} aria-hidden="true" />
          Continue with Google
        </>
      )}
    </button>
  );
};

export default GoogleSignIn;
