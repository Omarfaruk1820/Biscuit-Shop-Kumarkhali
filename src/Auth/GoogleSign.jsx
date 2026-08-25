import { useContext, useState } from "react";

import { FcGoogle } from "react-icons/fc";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

const GoogleSign = () => {
  const authContext = useContext(AuthContext);

  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);

  const signInWithGoogle = authContext?.signInWithGoogle;
  const authLoading = authContext?.loading ?? false;

  const isLoading = loading || authLoading;

  const handleGoogleSignIn = async () => {
    if (isLoading) {
      return;
    }

    if (typeof signInWithGoogle !== "function") {
      console.error(
        "GOOGLE SIGN-IN ERROR: signInWithGoogle is not available in AuthContext.",
      );

      addToast(
        "Google sign-in is not available. Please refresh the page and try again.",
        "error",
      );

      return;
    }

    setLoading(true);

    try {
      const result = await signInWithGoogle();

      if (!result?.success || !result?.user) {
        throw new Error(
          result?.message || "Google sign-in could not be completed.",
        );
      }

      addToast(
        result?.message || "Google sign-in successful! Welcome back.",
        "success",
      );
    } catch (error) {
      console.error(
        "GOOGLE SIGN-IN ERROR:",
        error?.response?.data || error?.message || error,
      );

      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      let message = "Google sign-in failed. Please try again.";

      switch (error?.code) {
        case "auth/popup-blocked":
          message =
            "Google sign-in popup was blocked. Please allow popups for this site.";
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

        case "auth/invalid-api-key":
          message =
            "Firebase configuration is invalid. Please check your Firebase configuration.";
          break;

        case "auth/internal-error":
          message = "Firebase encountered an internal error. Please try again.";
          break;

        case "auth/user-token-expired":
          message =
            "Your Google authentication session expired. Please try again.";
          break;

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label="Continue with Google"
      className="btn btn-outline w-full gap-3"
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
