import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaCheckCircle,
  FaChevronRight,
  FaCog,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaKey,
  FaLock,
  FaPencilAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaSyncAlt,
  FaTimes,
  FaUser,
  FaUserCircle,
  FaUserShield,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

// ============================================================
// HELPERS
// ============================================================

const normalizeValue = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const formatRole = (role) => {
  const normalizedRole = normalizeValue(role);

  if (!normalizedRole) {
    return "User";
  }

  return normalizedRole
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatProvider = (provider) => {
  const normalizedProvider = normalizeValue(provider).toLowerCase();

  if (normalizedProvider === "google" || normalizedProvider === "google.com") {
    return "Google";
  }

  if (
    normalizedProvider === "password" ||
    normalizedProvider === "email" ||
    normalizedProvider === "email/password"
  ) {
    return "Email & Password";
  }

  return normalizedProvider
    ? normalizedProvider
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "Email & Password";
};

const getInitials = (name, email) => {
  const source = normalizeValue(name) || normalizeValue(email) || "User";

  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ============================================================
// SETTINGS COMPONENT
// ============================================================

const Settings = () => {
  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const {
    user,
    loading: authLoading,
    role,
    status,
    updateUserProfile,
    refreshUser,
    resendEmailVerification,
    logOutUser,
  } = useContext(AuthContext);

  // ==========================================================
  // STATE
  // ==========================================================

  const [activeSection, setActiveSection] = useState("account");

  const [profileForm, setProfileForm] = useState({
    name: "",
    photo: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // ==========================================================
  // SYNC USER DATA
  // ==========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      name: normalizeValue(user.name),
      photo: normalizeValue(user.photo),
    });
  }, [user]);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const displayName = normalizeValue(user?.name) || "User";

  const email = normalizeValue(user?.email) || "No email available";

  const photo = normalizeValue(user?.photo);

  const formattedRole = formatRole(role || user?.role);

  const formattedProvider = formatProvider(user?.provider);

  const accountStatus =
    normalizeValue(status || user?.status).toLowerCase() || "active";

  const isActive = accountStatus === "active";

  const emailVerified = Boolean(user?.emailVerified);

  const initials = useMemo(() => {
    return getInitials(displayName, email);
  }, [displayName, email]);

  // ==========================================================
  // MESSAGE
  // ==========================================================

  const clearMessage = () => {
    setMessage({
      type: "",
      text: "",
    });
  };

  const showSuccess = (text) => {
    setMessage({
      type: "success",
      text,
    });
  };

  const showError = (text) => {
    setMessage({
      type: "error",
      text,
    });
  };

  // ==========================================================
  // PROFILE FORM
  // ==========================================================

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (message.text) {
      clearMessage();
    }
  };

  const validateProfile = () => {
    const name = normalizeValue(profileForm.name);
    const photo = normalizeValue(profileForm.photo);

    if (!name) {
      return {
        valid: false,
        message: "Name is required.",
      };
    }

    if (name.length < 2) {
      return {
        valid: false,
        message: "Name must contain at least 2 characters.",
      };
    }

    if (name.length > 100) {
      return {
        valid: false,
        message: "Name cannot exceed 100 characters.",
      };
    }

    if (photo) {
      try {
        const photoUrl = new URL(photo);

        if (photoUrl.protocol !== "http:" && photoUrl.protocol !== "https:") {
          throw new Error("Invalid protocol");
        }
      } catch {
        return {
          valid: false,
          message: "Please provide a valid HTTP or HTTPS photo URL.",
        };
      }
    }

    return {
      valid: true,
      name,
      photo,
    };
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    const validation = validateProfile();

    if (!validation.valid) {
      showError(validation.message);
      return;
    }

    if (typeof updateUserProfile !== "function") {
      showError("Profile update service is unavailable.");
      return;
    }

    setSavingProfile(true);
    clearMessage();

    try {
      const result = await updateUserProfile(validation.name, validation.photo);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to update your profile.");
      }

      showSuccess(result.message || "Profile updated successfully.");
    } catch (error) {
      console.error(
        "SETTINGS PROFILE UPDATE ERROR:",
        error?.response?.data || error?.message || error,
      );

      showError(getErrorMessage(error, "Failed to update your profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  // ==========================================================
  // REFRESH ACCOUNT
  // ==========================================================

  const handleRefresh = async () => {
    if (refreshing || savingProfile || sendingVerification) {
      return;
    }

    if (typeof refreshUser !== "function") {
      showError("Account refresh service is unavailable.");
      return;
    }

    setRefreshing(true);
    clearMessage();

    try {
      const refreshedUser = await refreshUser();

      if (!refreshedUser) {
        throw new Error("Unable to refresh account information.");
      }

      showSuccess("Account information refreshed successfully.");
    } catch (error) {
      console.error(
        "SETTINGS REFRESH ERROR:",
        error?.response?.data || error?.message || error,
      );

      showError(
        getErrorMessage(error, "Failed to refresh account information."),
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================================
  // EMAIL VERIFICATION
  // ==========================================================

  const handleResendVerification = async () => {
    if (sendingVerification || emailVerified) {
      return;
    }

    if (typeof resendEmailVerification !== "function") {
      showError("Email verification service is unavailable.");
      return;
    }

    setSendingVerification(true);
    clearMessage();

    try {
      const result = await resendEmailVerification();

      showSuccess(result?.message || "Verification email sent successfully.");
    } catch (error) {
      console.error("RESEND VERIFICATION ERROR:", error?.message || error);

      showError(getErrorMessage(error, "Unable to send verification email."));
    } finally {
      setSendingVerification(false);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    if (typeof logOutUser !== "function") {
      showError("Logout service is unavailable.");
      return;
    }

    setLoggingOut(true);

    try {
      await logOutUser();
      setShowLogoutModal(false);
    } catch (error) {
      console.error("SETTINGS LOGOUT ERROR:", error?.message || error);

      showError(getErrorMessage(error, "Failed to sign out."));
    } finally {
      setLoggingOut(false);
    }
  };

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <section className="min-h-screen bg-base-200/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-9 w-56 animate-pulse rounded-lg bg-base-300" />
            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-base-300" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="h-[520px] animate-pulse rounded-3xl bg-base-100" />
            <div className="h-[520px] animate-pulse rounded-3xl bg-base-100 lg:col-span-3" />
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================

  if (!user) {
    return (
      <section className="min-h-screen bg-base-200/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-base-300 bg-base-100 p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-base-200">
              <FaUserCircle className="text-5xl text-base-content/40" />
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Settings Unavailable
            </h1>

            <p className="mt-3 text-base-content/60">
              Please sign in to manage your account settings.
            </p>

            <Link to="/login" className="btn btn-primary mt-7 px-8">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="min-h-screen bg-base-200/40 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <FaCog />
              <span>Account Management</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-base-content/60">
              Manage your profile, account security, verification, and session
              preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || savingProfile || sendingVerification}
            className="btn btn-outline w-full sm:w-auto"
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh Account"}
          </button>
        </div>

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message.text ? (
          <div
            className={`alert mb-6 ${
              message.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            {message.type === "success" ? <FaCheckCircle /> : <FaTimes />}

            <span>{message.text}</span>
          </div>
        ) : null}

        {/* ==================================================
            SETTINGS LAYOUT
        ================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="h-fit rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
            {/* USER MINI CARD */}

            <div className="mb-3 rounded-2xl bg-base-200/60 p-4">
              <div className="flex items-center gap-3">
                {photo ? (
                  <img
                    src={photo}
                    alt={displayName}
                    className="h-12 w-12 rounded-full border border-base-300 bg-base-100 object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";

                      const fallback = event.currentTarget.nextElementSibling;

                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                ) : null}

                <div
                  className={`${
                    photo ? "hidden" : "flex"
                  } h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-content`}
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold">{displayName}</p>

                  <p className="truncate text-xs text-base-content/50">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            {/* NAVIGATION */}

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection("account")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === "account"
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200"
                }`}
              >
                <FaUser />
                <span className="flex-1">Account</span>
                <FaChevronRight className="text-xs" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("profile")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === "profile"
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200"
                }`}
              >
                <FaPencilAlt />
                <span className="flex-1">Profile</span>
                <FaChevronRight className="text-xs" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("security")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === "security"
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200"
                }`}
              >
                <FaShieldAlt />
                <span className="flex-1">Security</span>
                <FaChevronRight className="text-xs" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("notifications")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === "notifications"
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200"
                }`}
              >
                <FaBell />
                <span className="flex-1">Notifications</span>
                <FaChevronRight className="text-xs" />
              </button>
            </div>

            <div className="my-4 border-t border-base-300" />

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-base-200"
            >
              <FaUserCircle />
              <span className="flex-1">View Profile</span>
              <FaChevronRight className="text-xs" />
            </Link>
          </aside>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <main className="lg:col-span-3">
            {/* ==================================================
                ACCOUNT
            ================================================== */}

            {activeSection === "account" ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
                  <div className="border-b border-base-300 p-6">
                    <h2 className="text-xl font-bold">Account Overview</h2>

                    <p className="mt-1 text-sm text-base-content/60">
                      Review the information associated with your account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    {/* EMAIL */}

                    <div className="rounded-2xl border border-base-300 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
                          <FaEnvelope />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-base-content/50">
                            Email Address
                          </p>

                          <p className="mt-1 break-all font-semibold">
                            {email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ROLE */}

                    <div className="rounded-2xl border border-base-300 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                          <FaUserShield />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-base-content/50">
                            Account Role
                          </p>

                          <p className="mt-1 font-semibold">{formattedRole}</p>
                        </div>
                      </div>
                    </div>

                    {/* PROVIDER */}

                    <div className="rounded-2xl border border-base-300 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                          <FaGlobe />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-base-content/50">
                            Sign-in Provider
                          </p>

                          <p className="mt-1 font-semibold">
                            {formattedProvider}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* STATUS */}

                    <div className="rounded-2xl border border-base-300 p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            isActive
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          <FaShieldAlt />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-base-content/50">
                            Account Status
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-semibold">
                              {isActive ? "Active" : formatRole(accountStatus)}
                            </span>

                            <span
                              className={`badge badge-xs ${
                                isActive ? "badge-success" : "badge-error"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCOUNT DATES */}

                <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
                  <div className="border-b border-base-300 p-6">
                    <h2 className="text-xl font-bold">Account Activity</h2>

                    <p className="mt-1 text-sm text-base-content/60">
                      Important account timestamps.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                    <div className="rounded-2xl bg-base-200/50 p-5">
                      <p className="text-xs uppercase tracking-wide text-base-content/50">
                        Created
                      </p>

                      <p className="mt-2 font-semibold">
                        {formatDate(user?.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-base-200/50 p-5">
                      <p className="text-xs uppercase tracking-wide text-base-content/50">
                        Updated
                      </p>

                      <p className="mt-2 font-semibold">
                        {formatDate(user?.updatedAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-base-200/50 p-5">
                      <p className="text-xs uppercase tracking-wide text-base-content/50">
                        Last Login
                      </p>

                      <p className="mt-2 font-semibold">
                        {formatDate(user?.lastLogin)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ==================================================
                PROFILE
            ================================================== */}

            {activeSection === "profile" ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
                  <div className="border-b border-base-300 p-6">
                    <h2 className="text-xl font-bold">Profile Settings</h2>

                    <p className="mt-1 text-sm text-base-content/60">
                      Update the information displayed across your account.
                    </p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="p-6">
                    {/* PROFILE PREVIEW */}

                    <div className="mb-7 rounded-2xl bg-base-200/50 p-5">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        {profileForm.photo ? (
                          <img
                            src={profileForm.photo}
                            alt={profileForm.name}
                            className="h-20 w-20 rounded-full border-4 border-base-100 bg-base-100 object-cover shadow-sm"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.nextElementSibling;

                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className={`${
                            profileForm.photo ? "hidden" : "flex"
                          } h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-content`}
                        >
                          {getInitials(profileForm.name, email)}
                        </div>

                        <div>
                          <p className="text-lg font-bold">
                            {normalizeValue(profileForm.name) || "Your Name"}
                          </p>

                          <p className="text-sm text-base-content/60">
                            {email}
                          </p>

                          <p className="mt-2 text-xs text-base-content/50">
                            Profile changes are synchronized with Firebase and
                            MongoDB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* NAME */}

                    <div className="form-control mb-6">
                      <label htmlFor="settings-name" className="label">
                        <span className="label-text font-semibold">
                          Full Name
                        </span>
                      </label>

                      <div className="relative">
                        <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />

                        <input
                          id="settings-name"
                          name="name"
                          type="text"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          maxLength={100}
                          disabled={savingProfile}
                          autoComplete="name"
                          placeholder="Enter your full name"
                          className="input input-bordered w-full pl-11"
                        />
                      </div>

                      <label className="label">
                        <span className="label-text-alt text-base-content/50">
                          2–100 characters.
                        </span>
                      </label>
                    </div>

                    {/* PHOTO */}

                    <div className="form-control">
                      <label htmlFor="settings-photo" className="label">
                        <span className="label-text font-semibold">
                          Profile Photo URL
                        </span>
                      </label>

                      <input
                        id="settings-photo"
                        name="photo"
                        type="url"
                        value={profileForm.photo}
                        onChange={handleProfileChange}
                        disabled={savingProfile}
                        autoComplete="url"
                        placeholder="https://example.com/photo.jpg"
                        className="input input-bordered w-full"
                      />

                      <label className="label">
                        <span className="label-text-alt text-base-content/50">
                          HTTP or HTTPS image URL.
                        </span>
                      </label>
                    </div>

                    {/* ACTION */}

                    <div className="mt-7 flex justify-end border-t border-base-300 pt-6">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="btn btn-primary"
                      >
                        {savingProfile ? (
                          <>
                            <span className="loading loading-spinner loading-sm" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {/* ==================================================
                SECURITY
            ================================================== */}

            {activeSection === "security" ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
                  <div className="border-b border-base-300 p-6">
                    <h2 className="text-xl font-bold">Security</h2>

                    <p className="mt-1 text-sm text-base-content/60">
                      Review your authentication and account security status.
                    </p>
                  </div>

                  <div className="space-y-4 p-6">
                    {/* EMAIL VERIFICATION */}

                    <div className="flex flex-col gap-4 rounded-2xl border border-base-300 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            emailVerified
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {emailVerified ? <FaCheckCircle /> : <FaEnvelope />}
                        </div>

                        <div>
                          <h3 className="font-bold">Email Verification</h3>

                          <p className="mt-1 text-sm text-base-content/60">
                            {emailVerified
                              ? "Your email address has been verified."
                              : "Your email address has not been verified yet."}
                          </p>

                          <p className="mt-1 break-all text-xs text-base-content/50">
                            {email}
                          </p>
                        </div>
                      </div>

                      {!emailVerified ? (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={sendingVerification}
                          className="btn btn-warning btn-sm"
                        >
                          {sendingVerification ? (
                            <>
                              <span className="loading loading-spinner loading-xs" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <FaEnvelope />
                              Verify Email
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="badge badge-success gap-2">
                          <FaCheckCircle />
                          Verified
                        </span>
                      )}
                    </div>

                    {/* AUTH PROVIDER */}

                    <div className="flex items-start gap-4 rounded-2xl border border-base-300 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FaKey />
                      </div>

                      <div>
                        <h3 className="font-bold">Authentication Provider</h3>

                        <p className="mt-1 text-sm text-base-content/60">
                          Your account is authenticated through{" "}
                          <strong>{formattedProvider}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* SESSION */}

                    <div className="flex items-start gap-4 rounded-2xl border border-base-300 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                        <FaLock />
                      </div>

                      <div>
                        <h3 className="font-bold">Application Session</h3>

                        <p className="mt-1 text-sm text-base-content/60">
                          Your authenticated application session is protected
                          using your backend authentication flow.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SIGN OUT */}

                <div className="rounded-3xl border border-warning/30 bg-warning/5 p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                        <FaSignOutAlt />
                      </div>

                      <div>
                        <h3 className="font-bold">Sign Out</h3>

                        <p className="mt-1 text-sm text-base-content/60">
                          Sign out from this device and end your current
                          application session.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="btn btn-outline btn-warning"
                    >
                      <FaSignOutAlt />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            {activeSection === "notifications" ? (
              <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
                <div className="border-b border-base-300 p-6">
                  <h2 className="text-xl font-bold">Notifications</h2>

                  <p className="mt-1 text-sm text-base-content/60">
                    Notification preferences can be managed here when
                    notification APIs are enabled.
                  </p>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-base-300">
                      <FaBell className="text-2xl text-base-content/50" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold">
                      Notification Preferences
                    </h3>

                    <p className="mx-auto mt-2 max-w-lg text-sm text-base-content/60">
                      Your current server-side authentication system does not
                      expose notification preference endpoints yet. This section
                      is intentionally kept ready for future notification
                      settings.
                    </p>

                    <div className="mt-5">
                      <span className="badge badge-ghost">
                        Coming with notification API
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      {/* ======================================================
          LOGOUT MODAL
      ====================================================== */}

      {showLogoutModal ? (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                <FaExclamationTriangle />
              </div>

              <div>
                <h3 className="text-xl font-bold">Sign out?</h3>

                <p className="mt-2 text-sm text-base-content/60">
                  You will be signed out from Firebase and your current
                  application session will be cleared.
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="btn btn-outline"
              >
                <FaTimes />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn btn-error"
              >
                {loggingOut ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <FaSignOutAlt />
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className="modal-backdrop"
            onClick={() => {
              if (!loggingOut) {
                setShowLogoutModal(false);
              }
            }}
          />
        </div>
      ) : null}
    </section>
  );
};

export default Settings;
