import { useContext, useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

// ============================================================
// GOOGLE SIGN IN
// ============================================================

const GoogleSign = () => {
  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const { signInGoogle, loading: authLoading } = useContext(AuthContext);

  // ==========================================================
  // TOAST
  // ==========================================================

  const { addToast } = useToast();

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [loading, setLoading] = useState(false);

  const isLoading = loading || authLoading;

  // ==========================================================
  // GOOGLE SIGN IN
  // ==========================================================

  const handleGoogleSignIn = async () => {
    if (isLoading) {
      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // AUTH PROVIDER HANDLES THE COMPLETE FLOW
      // ======================================================
      //
      // Google Popup
      //      ↓
      // Firebase User
      //      ↓
      // Firebase ID Token
      //      ↓
      // POST /users
      //      ↓
      // POST /auth/jwt
      //      ↓
      // HTTP-only Cookie
      //      ↓
      // GET /auth/me
      //      ↓
      // AuthProvider user state
      //
      // signInGoogle() returns the server user.
      // ======================================================

      const serverUser = await signInGoogle();

      if (!serverUser) {
        throw new Error("Google sign-in could not be completed.");
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      addToast("Google sign-in successful! Welcome back.", "success");
    } catch (error) {
      // ======================================================
      // DEBUG
      // ======================================================

      console.error(
        "GOOGLE SIGN-IN ERROR:",
        error?.response?.data || error?.message || error,
      );

      // ======================================================
      // USER CLOSED GOOGLE POPUP
      // ======================================================

      if (error?.code === "auth/popup-closed-by-user") {
        return;
      }

      if (error?.code === "auth/cancelled-popup-request") {
        return;
      }

      // ======================================================
      // ERROR MESSAGE
      // ======================================================

      let message = "Google sign-in failed. Please try again.";

      switch (error?.code) {
        // ----------------------------------------------------
        // FIREBASE
        // ----------------------------------------------------

        case "auth/popup-blocked":
          message =
            "Google sign-in popup was blocked. Please allow popups for this site.";
          break;

        case "auth/cancelled-popup-request":
          message = "Another Google sign-in request is already in progress.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many sign-in attempts. Please try again later.";
          break;

        case "auth/account-exists-with-different-credential":
          message =
            "This email is already registered with another sign-in method.";
          break;

        case "auth/operation-not-allowed":
          message = "Google sign-in is currently disabled.";
          break;

        case "auth/user-disabled":
          message = "This account has been disabled.";
          break;

        case "auth/unauthorized-domain":
          message = "This domain is not authorized for Google sign-in.";
          break;

        case "auth/invalid-credential":
          message =
            "Google authentication could not be verified. Please try again.";
          break;

        // ----------------------------------------------------
        // CUSTOM AUTH PROVIDER ERRORS
        // ----------------------------------------------------

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      // ======================================================
      // SHOW ERROR
      // ======================================================

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="btn btn-outline w-full gap-3"
      aria-busy={isLoading}
      aria-label="Continue with Google"
    >
      {isLoading ? (
        <>
          <span
            className="loading loading-spinner loading-sm"
            aria-hidden="true"
          />

          <span>Signing in...</span>
        </>
      ) : (
        <>
          <FcGoogle size={22} aria-hidden="true" />

          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
};

export default GoogleSign;
