import { useContext, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {
  FaCamera,
  FaCheckCircle,
  FaEnvelope,
  FaIdBadge,
  FaKey,
  FaLink,
  FaPencilAlt,
  FaRegClock,
  FaShieldAlt,
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

const formatRole = (value) => {
  const role = normalizeValue(value);

  if (!role) {
    return "User";
  }

  return role
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatProvider = (value) => {
  const provider = normalizeValue(value).toLowerCase();

  if (!provider) {
    return "Email & Password";
  }

  if (provider === "google" || provider === "google.com") {
    return "Google";
  }

  if (
    provider === "password" ||
    provider === "email" ||
    provider === "email/password"
  ) {
    return "Email & Password";
  }

  return provider
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getInitials = (name, email) => {
  const source = normalizeValue(name) || normalizeValue(email) || "User";

  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return error?.response?.data?.message || error?.message || fallback;
};

const isValidPhotoUrl = (value) => {
  const photo = normalizeValue(value);

  if (!photo) {
    return true;
  }

  try {
    const url = new URL(photo);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// ============================================================
// COMPONENT
// ============================================================

const Profile = () => {
  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const {
    user,
    loading: authLoading,
    updateUserProfile,
    refreshUser,
  } = useContext(AuthContext);

  // ==========================================================
  // STATE
  // ==========================================================

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    photo: "",
  });

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // ==========================================================
  // SYNC FORM WITH USER
  // ==========================================================

  useEffect(() => {
    if (!user || isEditing) {
      return;
    }

    setFormData({
      name: normalizeValue(user.name),
      photo: normalizeValue(user.photo),
    });
  }, [user, isEditing]);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const displayName = normalizeValue(user?.name) || "User";

  const email = normalizeValue(user?.email) || "No email available";

  const photo = normalizeValue(user?.photo);

  const role = formatRole(user?.role);

  const provider = formatProvider(user?.provider);

  const accountStatus = normalizeValue(user?.status).toLowerCase() || "active";

  const isActive = accountStatus === "active";

  const isEmailVerified = Boolean(user?.emailVerified);

  const initials = useMemo(
    () => getInitials(displayName, email),
    [displayName, email],
  );

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
  // INPUT CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (message.text) {
      clearMessage();
    }
  };

  // ==========================================================
  // START EDITING
  // ==========================================================

  const handleEdit = () => {
    setFormData({
      name: normalizeValue(user?.name),
      photo: normalizeValue(user?.photo),
    });

    clearMessage();
    setIsEditing(true);
  };

  // ==========================================================
  // CANCEL EDITING
  // ==========================================================

  const handleCancel = () => {
    setFormData({
      name: normalizeValue(user?.name),
      photo: normalizeValue(user?.photo),
    });

    clearMessage();
    setIsEditing(false);
  };

  // ==========================================================
  // VALIDATE PROFILE
  // ==========================================================

  const validateProfile = () => {
    const name = normalizeValue(formData.name);

    const photo = normalizeValue(formData.photo);

    if (!name) {
      return {
        valid: false,
        message: "Please enter your name.",
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

    if (!isValidPhotoUrl(photo)) {
      return {
        valid: false,
        message: "Please provide a valid HTTP or HTTPS photo URL.",
      };
    }

    return {
      valid: true,
      name,
      photo,
    };
  };

  // ==========================================================
  // SUBMIT PROFILE
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
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

    setSaving(true);
    clearMessage();

    try {
      const result = await updateUserProfile(validation.name, validation.photo);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to update your profile.");
      }

      // AuthProvider already updates user state.
      // Keep local form synchronized with server result.
      const updatedUser = result?.user;

      setFormData({
        name: normalizeValue(updatedUser?.name) || validation.name,

        photo: normalizeValue(updatedUser?.photo) || validation.photo,
      });

      setIsEditing(false);

      showSuccess(
        result?.message || "Your profile has been updated successfully.",
      );
    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error?.response?.data || error?.message || error,
      );

      showError(
        getErrorMessage(
          error,
          "Failed to update your profile. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // REFRESH PROFILE
  // ==========================================================

  const handleRefresh = async () => {
    if (refreshing || saving) {
      return;
    }

    if (typeof refreshUser !== "function") {
      showError("Profile refresh service is unavailable.");
      return;
    }

    setRefreshing(true);
    clearMessage();

    try {
      const refreshedUser = await refreshUser();

      if (!refreshedUser) {
        throw new Error("Unable to refresh your profile.");
      }

      showSuccess("Profile information refreshed successfully.");
    } catch (error) {
      console.error(
        "PROFILE REFRESH ERROR:",
        error?.response?.data || error?.message || error,
      );

      showError(getErrorMessage(error, "Failed to refresh your profile."));
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <section className="min-h-screen bg-base-200/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="h-9 w-48 animate-pulse rounded-lg bg-base-300" />

            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-base-300" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-[460px] animate-pulse rounded-3xl bg-base-100" />

            <div className="h-[460px] animate-pulse rounded-3xl bg-base-100 lg:col-span-2" />
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
              Profile Unavailable
            </h1>

            <p className="mt-3 text-base-content/60">
              Please sign in to view and manage your profile.
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
      <div className="mx-auto max-w-6xl">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <FaUser />
              <span>Account</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Profile
            </h1>

            <p className="mt-2 max-w-2xl text-base-content/60">
              Manage your personal information and review your account details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || saving}
            className="btn btn-outline w-full sm:w-auto"
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
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
            MAIN GRID
        ================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* =================================================
              LEFT PROFILE CARD
          ================================================= */}

          <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
            <div className="h-28 bg-gradient-to-r from-primary/80 via-primary to-secondary/80" />

            <div className="px-6 pb-7">
              {/* AVATAR */}

              <div className="-mt-14 mb-5 flex justify-center">
                <div className="relative">
                  {photo ? (
                    <img
                      src={photo}
                      alt={displayName}
                      className="h-28 w-28 rounded-full border-4 border-base-100 bg-base-200 object-cover shadow-lg"
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
                    } h-28 w-28 items-center justify-center rounded-full border-4 border-base-100 bg-primary text-3xl font-bold text-primary-content shadow-lg`}
                  >
                    {initials}
                  </div>

                  <div
                    className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-base-100 ${
                      isActive ? "bg-success" : "bg-error"
                    }`}
                    title={isActive ? "Active" : "Inactive"}
                  />
                </div>
              </div>

              {/* USER NAME */}

              <div className="text-center">
                <h2 className="break-words text-2xl font-bold">
                  {displayName}
                </h2>

                <p className="mt-1 break-all text-sm text-base-content/60">
                  {email}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="badge badge-primary badge-outline">
                    {role}
                  </span>

                  <span className="badge badge-ghost">{provider}</span>
                </div>
              </div>

              {/* ACCOUNT STATUS */}

              <div className="mt-7 rounded-2xl border border-base-300 bg-base-200/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-success/10 text-success"
                          : "bg-error/10 text-error"
                      }`}
                    >
                      <FaShieldAlt />
                    </div>

                    <div>
                      <p className="text-xs text-base-content/50">
                        Account Status
                      </p>

                      <p className="font-semibold">
                        {isActive ? "Active" : formatRole(accountStatus)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`badge badge-sm ${
                      isActive ? "badge-success" : "badge-error"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* EMAIL VERIFICATION */}

              <div className="mt-3 rounded-2xl border border-base-300 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isEmailVerified
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    <FaEnvelope />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-base-content/50">
                      Email Verification
                    </p>

                    <p className="font-semibold">
                      {isEmailVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>

                  {isEmailVerified ? (
                    <FaCheckCircle className="ml-auto shrink-0 text-success" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT CONTENT
          ================================================= */}

          <div className="space-y-6 lg:col-span-2">
            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-base-300 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Personal Information</h2>

                  <p className="mt-1 text-sm text-base-content/60">
                    Your profile information synchronized with your account.
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="btn btn-primary btn-sm w-full sm:w-auto"
                  >
                    <FaPencilAlt />
                    Edit Profile
                  </button>
                ) : null}
              </div>

              {/* =================================================
                  VIEW MODE
              ================================================= */}

              {!isEditing ? (
                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                  {/* NAME */}

                  <div className="rounded-2xl border border-base-300 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FaUser />
                      </div>

                      <p className="text-sm font-medium text-base-content/50">
                        Full Name
                      </p>
                    </div>

                    <p className="break-words text-lg font-semibold">
                      {displayName}
                    </p>
                  </div>

                  {/* EMAIL */}

                  <div className="rounded-2xl border border-base-300 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
                        <FaEnvelope />
                      </div>

                      <p className="text-sm font-medium text-base-content/50">
                        Email Address
                      </p>
                    </div>

                    <p className="break-all text-lg font-semibold">{email}</p>
                  </div>

                  {/* ROLE */}

                  <div className="rounded-2xl border border-base-300 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <FaUserShield />
                      </div>

                      <p className="text-sm font-medium text-base-content/50">
                        Account Role
                      </p>
                    </div>

                    <p className="text-lg font-semibold">{role}</p>
                  </div>

                  {/* PROVIDER */}

                  <div className="rounded-2xl border border-base-300 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <FaLink />
                      </div>

                      <p className="text-sm font-medium text-base-content/50">
                        Sign-in Provider
                      </p>
                    </div>

                    <p className="text-lg font-semibold">{provider}</p>
                  </div>
                </div>
              ) : (
                /* =================================================
                   EDIT MODE
                ================================================= */

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* NAME */}

                    <div className="form-control">
                      <label htmlFor="profile-name" className="label">
                        <span className="label-text font-semibold">
                          Full Name
                        </span>
                      </label>

                      <div className="relative">
                        <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />

                        <input
                          id="profile-name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className="input input-bordered w-full pl-11"
                          maxLength={100}
                          disabled={saving}
                          autoComplete="name"
                        />
                      </div>

                      <label className="label">
                        <span className="label-text-alt text-base-content/50">
                          Your name will be synchronized with Firebase and the
                          server.
                        </span>
                      </label>
                    </div>

                    {/* PHOTO */}

                    <div className="form-control">
                      <label htmlFor="profile-photo" className="label">
                        <span className="label-text font-semibold">
                          Profile Photo URL
                        </span>
                      </label>

                      <div className="relative">
                        <FaCamera className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />

                        <input
                          id="profile-photo"
                          name="photo"
                          type="url"
                          value={formData.photo}
                          onChange={handleChange}
                          placeholder="https://example.com/profile.jpg"
                          className="input input-bordered w-full pl-11"
                          disabled={saving}
                          autoComplete="url"
                        />
                      </div>

                      <label className="label">
                        <span className="label-text-alt text-base-content/50">
                          Use a publicly accessible HTTP or HTTPS image URL.
                        </span>
                      </label>
                    </div>

                    {/* PREVIEW */}

                    <div className="rounded-2xl border border-base-300 bg-base-200/40 p-5">
                      <p className="mb-4 text-sm font-semibold">
                        Profile Preview
                      </p>

                      <div className="flex items-center gap-4">
                        {normalizeValue(formData.photo) ? (
                          <img
                            src={normalizeValue(formData.photo)}
                            alt="Profile preview"
                            className="h-16 w-16 shrink-0 rounded-full border border-base-300 bg-base-100 object-cover"
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
                            normalizeValue(formData.photo) ? "hidden" : "flex"
                          } h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-content`}
                        >
                          {getInitials(formData.name, email)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {normalizeValue(formData.name) || "Your Name"}
                          </p>

                          <p className="truncate text-sm text-base-content/60">
                            {email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="mt-7 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="btn btn-outline"
                    >
                      <FaTimes />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? (
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
              )}
            </div>

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
              <div className="border-b border-base-300 p-6">
                <h2 className="text-xl font-bold">Account Information</h2>

                <p className="mt-1 text-sm text-base-content/60">
                  Important details associated with your account.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                {/* USER ID */}

                <div className="rounded-2xl bg-base-200/50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-300 text-base-content/70">
                      <FaIdBadge />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                        User ID
                      </p>

                      <p className="mt-1 break-all font-mono text-sm font-medium">
                        {user?.uid || user?._id || "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ROLE */}

                <div className="rounded-2xl bg-base-200/50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-300 text-base-content/70">
                      <FaUserShield />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                        Role
                      </p>

                      <p className="mt-1 font-semibold">{role}</p>
                    </div>
                  </div>
                </div>

                {/* CREATED */}

                <div className="rounded-2xl bg-base-200/50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-300 text-base-content/70">
                      <FaRegClock />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                        Account Created
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatDate(user?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* UPDATED */}

                <div className="rounded-2xl bg-base-200/50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-300 text-base-content/70">
                      <FaSyncAlt />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                        Last Updated
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatDate(user?.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* LAST LOGIN */}

                <div className="rounded-2xl bg-base-200/50 p-5 md:col-span-2">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-300 text-base-content/70">
                      <FaKey />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                        Last Login
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatDate(user?.lastLogin)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
