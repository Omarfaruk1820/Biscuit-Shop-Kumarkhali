import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaCalendarAlt, FaCog, FaSearch } from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

const DashboardHeader = () => {
  const { user, loading, signOutUser } = useContext(AuthContext);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchValue, setSearchValue] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <header className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm lg:p-6">
        <div className="flex animate-pulse flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="h-4 w-32 rounded bg-base-300" />
            <div className="mt-3 h-9 w-64 rounded bg-base-300" />
            <div className="mt-3 h-4 w-72 rounded bg-base-300" />
          </div>

          <div className="flex gap-3">
            <div className="h-11 w-64 rounded-xl bg-base-300" />
            <div className="h-11 w-11 rounded-full bg-base-300" />
            <div className="h-11 w-11 rounded-full bg-base-300" />
            <div className="h-11 w-36 rounded-xl bg-base-300" />
          </div>
        </div>
      </header>
    );
  }

  const role = user?.role === "admin" ? "admin" : "user";
  const isAdmin = role === "admin";

  const userName = user?.name?.trim() || "User";
  const userEmail = user?.email?.trim() || "";
  const userPhoto = user?.photo?.trim() || "";

  const dashboardTitle = isAdmin ? "Admin Dashboard" : "My Dashboard";

  const roleLabel = isAdmin ? "Administrator" : "Customer";

  const initial = userName.charAt(0).toUpperCase() || "U";

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      return;
    }

    console.log("Dashboard search:", value);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await signOutUser();
    } catch (error) {
      console.error("Dashboard Header Logout Error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="p-5 lg:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          {/* =====================================================
              LEFT SIDE
          ====================================================== */}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />

              <p className="text-sm font-medium text-base-content/60">
                Welcome back, {userName}
              </p>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              {dashboardTitle}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/50">
              <span className="flex items-center gap-2">
                <FaCalendarAlt className="text-primary" />
                {formattedDate}
              </span>

              <span className="hidden sm:inline">•</span>

              <span className="font-medium text-base-content/70">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* =====================================================
              RIGHT SIDE
          ====================================================== */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* =================================================
                SEARCH
            ================================================== */}

            <form
              onSubmit={handleSearchSubmit}
              className="w-full sm:w-72 lg:w-80"
            >
              <label className="input input-bordered flex h-11 w-full items-center gap-3 rounded-xl bg-base-100">
                <FaSearch className="shrink-0 text-base-content/40" />

                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search products, orders..."
                  className="grow text-sm"
                  aria-label="Search dashboard"
                />

                {searchValue ? (
                  <kbd className="kbd kbd-sm hidden sm:inline">Enter</kbd>
                ) : null}
              </label>
            </form>

            {/* =================================================
                ACTIONS
            ================================================== */}

            <div className="flex items-center gap-2">
              {/* Notifications */}

              <Link
                to="/dashboard/notifications"
                className="btn btn-square btn-ghost relative rounded-xl border border-base-300"
                aria-label="Notifications"
              >
                <FaBell className="text-lg" />

                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-base-100" />
              </Link>

              {/* Settings */}

              <Link
                to="/dashboard/settings"
                className="btn btn-square btn-ghost rounded-xl border border-base-300"
                aria-label="Settings"
              >
                <FaCog className="text-lg" />
              </Link>

              {/* =================================================
                  PROFILE
              ================================================== */}

              <div className="dropdown dropdown-end">
                <button
                  type="button"
                  tabIndex={0}
                  className="btn btn-ghost h-12 gap-3 rounded-xl border border-base-300 px-2 sm:px-3"
                  aria-label="Open profile menu"
                >
                  {userPhoto ? (
                    <div className="avatar">
                      <div className="w-9 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                        <img
                          src={userPhoto}
                          alt={userName}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar placeholder">
                      <div className="w-9 rounded-full bg-primary text-primary-content">
                        <span className="text-sm font-bold">{initial}</span>
                      </div>
                    </div>
                  )}

                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="max-w-28 truncate text-sm font-semibold">
                      {userName}
                    </p>

                    <p className="text-xs text-base-content/50">{roleLabel}</p>
                  </div>

                  <span className="hidden text-base-content/40 sm:inline">
                    ▾
                  </span>
                </button>

                <ul
                  tabIndex={0}
                  className="dropdown-content z-[100] mt-3 w-72 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
                >
                  {/* Profile Summary */}

                  <li className="mb-1">
                    <div className="flex items-center gap-3 rounded-xl p-3">
                      {userPhoto ? (
                        <div className="avatar">
                          <div className="w-11 rounded-full">
                            <img src={userPhoto} alt={userName} />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className="w-11 rounded-full bg-primary text-primary-content">
                            <span className="font-bold">{initial}</span>
                          </div>
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-semibold">{userName}</p>

                        <p className="truncate text-xs text-base-content/50">
                          {userEmail}
                        </p>

                        <span
                          className={`badge badge-sm mt-2 ${
                            isAdmin ? "badge-primary" : "badge-success"
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </li>

                  <div className="divider my-1" />

                  <li>
                    <Link to="/dashboard/profile">My Profile</Link>
                  </li>

                  <li>
                    <Link to="/dashboard/settings">Settings</Link>
                  </li>

                  <li>
                    <Link to="/dashboard/notifications">Notifications</Link>
                  </li>

                  <div className="divider my-1" />

                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="text-error"
                    >
                      {isLoggingOut ? (
                        <>
                          <span className="loading loading-spinner loading-sm" />
                          Logging out...
                        </>
                      ) : (
                        "Logout"
                      )}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
          MOBILE / ROLE INFO BAR
      ======================================================== */}

      <div className="border-t border-base-300 bg-base-200/40 px-5 py-3 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-base-content/50">
            <span className="font-medium text-base-content/70">Account:</span>

            <span>{userEmail || "No email available"}</span>
          </div>

          <span
            className={`badge badge-sm ${
              isAdmin ? "badge-primary" : "badge-success"
            }`}
          >
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
