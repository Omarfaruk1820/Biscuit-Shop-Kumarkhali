import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaExclamationTriangle,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTimes,
  FaTrash,
  FaUser,
  FaUserCog,
  FaUsers,
  FaUserShield,
  FaUserSlash,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import axiosSecure from "../../hooks/axiosSecure";

// ============================================================
// CONFIGURATION
// ============================================================

const USERS_PER_PAGE = 10;
const API_USERS_LIMIT = 50;

// ============================================================
// HELPERS
// ============================================================

const getUserId = (user) => {
  return user?._id || user?.id || user?.uid || "";
};

const getUserName = (user) => {
  const name = typeof user?.name === "string" ? user.name.trim() : "";

  return name || "Unknown User";
};

const getUserEmail = (user) => {
  const email = typeof user?.email === "string" ? user.email.trim() : "";

  return email || "No email";
};

const getUserRole = (user) => {
  return user?.role === "admin" ? "admin" : "user";
};

const getUserStatus = (user) => {
  return user?.status === "blocked" ? "blocked" : "active";
};

const getInitial = (name) => {
  return name?.charAt(0)?.toUpperCase() || "U";
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatProvider = (provider) => {
  if (!provider) {
    return "—";
  }

  if (provider === "google.com") {
    return "Google";
  }

  if (provider === "password") {
    return "Password";
  }

  return provider;
};

// ============================================================
// COMPONENT
// ============================================================

const AllUsers = () => {
  const { user: currentUser } = useContext(AuthContext);

  // ==========================================================
  // STATE
  // ==========================================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [viewMode, setViewMode] = useState("table");

  // ==========================================================
  // CURRENT USER CHECK
  // ==========================================================

  const isCurrentUser = useCallback(
    (targetUser) => {
      if (!targetUser || !currentUser) {
        return false;
      }

      const targetUid = targetUser?.uid;
      const currentUid = currentUser?.uid;

      if (!targetUid || !currentUid) {
        return false;
      }

      return targetUid === currentUid;
    },
    [currentUser],
  );

  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchUsers = useCallback(async ({ isRefresh = false } = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axiosSecure.get("/users", {
        params: {
          page: 1,
          limit: API_USERS_LIMIT,
          sort: "newest",
        },
      });

      const responseData = response?.data;

      let usersData = [];

      if (Array.isArray(responseData?.data)) {
        usersData = responseData.data;
      } else if (Array.isArray(responseData?.users)) {
        usersData = responseData.users;
      } else if (Array.isArray(responseData)) {
        usersData = responseData;
      }

      setUsers(usersData);
      setCurrentPage(1);
    } catch (err) {
      console.error("Fetch Users Error:", err);

      const status = err?.response?.status;
      const serverCode = err?.response?.data?.code;
      const serverMessage = err?.response?.data?.message;

      if (status === 401) {
        if (serverCode === "auth/token-missing") {
          setError(
            "Authentication token is missing. Please login again and make sure your Firebase authentication token is being sent with the request.",
          );
        } else if (serverCode === "auth/token-invalid") {
          setError(
            "Your authentication token is invalid or expired. Please login again.",
          );
        } else {
          setError(
            serverMessage || "You are not authenticated. Please login again.",
          );
        }
      } else if (status === 403) {
        setError(
          serverMessage ||
            "You do not have permission to view all users. Admin access is required.",
        );
      } else if (status === 404) {
        setError("Users API endpoint was not found.");
      } else if (err?.code === "ECONNABORTED") {
        setError("Request timed out. Please try again.");
      } else if (!err?.response) {
        setError(
          "Unable to connect to the server. Please check your backend server.",
        );
      } else {
        setError(serverMessage || "Failed to load users. Please try again.");
      }

      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ==========================================================
  // FILTER USERS
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((item) => {
      const name = getUserName(item).toLowerCase();
      const email = getUserEmail(item).toLowerCase();
      const uid = String(item?.uid || "").toLowerCase();

      const role = getUserRole(item);
      const status = getUserStatus(item);

      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        uid.includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || role === roleFilter;

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // ==========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalUsers = filteredUsers.length;

  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex =
    totalUsers === 0 ? 0 : (safeCurrentPage - 1) * USERS_PER_PAGE;

  const endIndex = Math.min(startIndex + USERS_PER_PAGE, totalUsers);

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const total = users.length;

    const admins = users.filter((item) => getUserRole(item) === "admin").length;

    const customers = users.filter(
      (item) => getUserRole(item) === "user",
    ).length;

    const active = users.filter(
      (item) => getUserStatus(item) === "active",
    ).length;

    const blocked = users.filter(
      (item) => getUserStatus(item) === "blocked",
    ).length;

    return {
      total,
      admins,
      customers,
      active,
      blocked,
    };
  }, [users]);

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = useCallback(() => {
    if (actionLoading) {
      return;
    }

    setSelectedUser(null);
    setActionError("");
  }, [actionLoading]);

  // ==========================================================
  // CHANGE ROLE
  // ==========================================================

  const handleRoleChange = useCallback(
    async (targetUser) => {
      if (!targetUser) {
        return;
      }

      if (isCurrentUser(targetUser)) {
        setActionError("You cannot change your own administrator role.");

        return;
      }

      const userId = getUserId(targetUser);

      if (!userId) {
        setActionError("User ID is missing.");

        return;
      }

      const currentRole = getUserRole(targetUser);

      const newRole = currentRole === "admin" ? "user" : "admin";

      const confirmed = window.confirm(
        `Are you sure you want to change ${getUserName(
          targetUser,
        )} from ${currentRole} to ${newRole}?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await axiosSecure.patch(`/users/${userId}/role`, {
          role: newRole,
        });

        const updatedAt = new Date().toISOString();

        setUsers((previousUsers) =>
          previousUsers.map((item) =>
            getUserId(item) === userId
              ? {
                  ...item,
                  role: newRole,
                  updatedAt,
                }
              : item,
          ),
        );

        setSelectedUser((previousUser) =>
          previousUser
            ? {
                ...previousUser,
                role: newRole,
                updatedAt,
              }
            : null,
        );
      } catch (err) {
        console.error("Change Role Error:", err);

        setActionError(
          err?.response?.data?.message || "Failed to change user role.",
        );
      } finally {
        setActionLoading(false);
      }
    },
    [isCurrentUser],
  );

  // ==========================================================
  // CHANGE STATUS
  // ==========================================================

  const handleStatusChange = useCallback(
    async (targetUser) => {
      if (!targetUser) {
        return;
      }

      if (isCurrentUser(targetUser)) {
        setActionError("You cannot change your own account status.");

        return;
      }

      const userId = getUserId(targetUser);

      if (!userId) {
        setActionError("User ID is missing.");

        return;
      }

      const currentStatus = getUserStatus(targetUser);

      const newStatus = currentStatus === "active" ? "blocked" : "active";

      const actionText = newStatus === "blocked" ? "block" : "activate";

      const confirmed = window.confirm(
        `Are you sure you want to ${actionText} ${getUserName(targetUser)}?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await axiosSecure.patch(`/users/${userId}/status`, {
          status: newStatus,
        });

        const updatedAt = new Date().toISOString();

        setUsers((previousUsers) =>
          previousUsers.map((item) =>
            getUserId(item) === userId
              ? {
                  ...item,
                  status: newStatus,
                  updatedAt,
                }
              : item,
          ),
        );

        setSelectedUser((previousUser) =>
          previousUser
            ? {
                ...previousUser,
                status: newStatus,
                updatedAt,
              }
            : null,
        );
      } catch (err) {
        console.error("Change Status Error:", err);

        setActionError(
          err?.response?.data?.message || "Failed to change user status.",
        );
      } finally {
        setActionLoading(false);
      }
    },
    [isCurrentUser],
  );

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDeleteUser = useCallback(
    async (targetUser) => {
      if (!targetUser) {
        return;
      }

      if (isCurrentUser(targetUser)) {
        setActionError("You cannot delete your own account.");

        return;
      }

      const userId = getUserId(targetUser);

      if (!userId) {
        setActionError("User ID is missing.");

        return;
      }

      const confirmed = window.confirm(
        `Delete ${getUserName(targetUser)}? This action cannot be undone.`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await axiosSecure.delete(`/users/${userId}`);

        setUsers((previousUsers) =>
          previousUsers.filter((item) => getUserId(item) !== userId),
        );

        setSelectedUser(null);
      } catch (err) {
        console.error("Delete User Error:", err);

        setActionError(
          err?.response?.data?.message || "Failed to delete user.",
        );
      } finally {
        setActionLoading(false);
      }
    },
    [isCurrentUser],
  );

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const pageNumbers = useMemo(() => {
    const pages = [];

    const maxVisiblePages = 5;

    let startPage = Math.max(1, safeCurrentPage - 2);

    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-base-300" />

            <div className="h-4 w-full max-w-md rounded bg-base-300" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-base-300"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-base-300" />
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full space-y-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FaUsers className="text-xl" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold md:text-3xl">All Users</h1>

              <p className="mt-1 text-sm text-base-content/60">
                Manage customers, administrators and account access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchUsers({ isRefresh: true })}
            disabled={refreshing}
            className="btn btn-outline w-full gap-2 sm:w-auto"
          >
            <FaRedo className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="alert alert-error flex-col items-start gap-3 rounded-2xl sm:flex-row sm:items-center">
          <FaExclamationTriangle className="shrink-0" />

          <div className="min-w-0 flex-1">
            <h3 className="font-bold">Unable to load users</h3>

            <p className="break-words text-sm">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => fetchUsers()}
            className="btn btn-sm w-full sm:w-auto"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ====================================================== */}
      {/* STATISTICS */}
      {/* ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* TOTAL */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">Total Users</p>

              <p className="mt-1 text-2xl font-bold">{statistics.total}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FaUsers />
            </div>
          </div>
        </div>

        {/* ADMINS */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">Administrators</p>

              <p className="mt-1 text-2xl font-bold">{statistics.admins}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <FaUserShield />
            </div>
          </div>
        </div>

        {/* CUSTOMERS */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">Customers</p>

              <p className="mt-1 text-2xl font-bold">{statistics.customers}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
              <FaUser />
            </div>
          </div>
        </div>

        {/* ACTIVE */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">Active</p>

              <p className="mt-1 text-2xl font-bold">{statistics.active}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <FaCheckCircle />
            </div>
          </div>
        </div>

        {/* BLOCKED */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">Blocked</p>

              <p className="mt-1 text-2xl font-bold">{statistics.blocked}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
              <FaUserSlash />
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FILTER BAR */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_180px_170px_auto]">
            {/* SEARCH */}

            <label className="input input-bordered flex w-full items-center gap-2">
              <FaSearch className="shrink-0 text-base-content/40" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, email or UID..."
                className="min-w-0 grow"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="btn btn-circle btn-ghost btn-xs shrink-0"
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </label>

            {/* ROLE */}

            <label className="select select-bordered flex w-full items-center gap-2">
              <FaUserCog className="shrink-0 text-base-content/40" />

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="min-w-0 grow"
              >
                <option value="all">All Roles</option>

                <option value="admin">Administrators</option>

                <option value="user">Customers</option>
              </select>
            </label>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">All Status</option>

              <option value="active">Active</option>

              <option value="blocked">Blocked</option>
            </select>

            {/* VIEW SWITCHER */}

            <div className="join w-full md:w-fit">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`btn join-item flex-1 md:flex-none ${
                  viewMode === "table" ? "btn-primary" : "btn-outline"
                }`}
                aria-label="Table view"
              >
                <FaUsers />
                <span className="hidden sm:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`btn join-item flex-1 md:flex-none ${
                  viewMode === "grid" ? "btn-primary" : "btn-outline"
                }`}
                aria-label="Grid view"
              >
                <FaUser />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* RESULTS INFO */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-base-content/60">
          {totalUsers === 0 ? (
            "No users found"
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-base-content">
                {startIndex + 1}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-base-content">
                {endIndex}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-base-content">
                {totalUsers}
              </span>{" "}
              users
            </>
          )}
        </p>

        {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
            className="btn btn-ghost btn-sm self-start sm:self-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ====================================================== */}
      {/* NO USERS */}
      {/* ====================================================== */}

      {paginatedUsers.length === 0 && (
        <div className="rounded-2xl border border-base-300 bg-base-100 px-5 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-base-200 text-base-content/40">
            <FaUsers className="text-2xl" />
          </div>

          <h2 className="mt-5 text-xl font-bold">No users found</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-base-content/60">
            Try changing your search term or removing one of the filters.
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* TABLE VIEW */}
      {/* ====================================================== */}

      {paginatedUsers.length > 0 && viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="table min-w-[900px]">
              <thead>
                <tr className="bg-base-200/60">
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Last Login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsers.map((item) => {
                  const name = getUserName(item);
                  const email = getUserEmail(item);
                  const role = getUserRole(item);
                  const status = getUserStatus(item);
                  const current = isCurrentUser(item);

                  return (
                    <tr key={getUserId(item)} className="hover:bg-base-200/40">
                      {/* USER */}

                      <td>
                        <div className="flex min-w-[240px] items-center gap-3">
                          {item?.photo ? (
                            <div className="avatar shrink-0">
                              <div className="h-11 w-11 rounded-full">
                                <img src={item.photo} alt={name} />
                              </div>
                            </div>
                          ) : (
                            <div className="avatar placeholder shrink-0">
                              <div className="h-11 w-11 rounded-full bg-primary text-primary-content">
                                <span className="font-bold">
                                  {getInitial(name)}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="max-w-48 truncate font-semibold">
                                {name}
                              </p>

                              {current && (
                                <span className="badge badge-primary badge-xs shrink-0">
                                  You
                                </span>
                              )}
                            </div>

                            <p className="flex max-w-56 items-center gap-1 truncate text-xs text-base-content/50">
                              <FaEnvelope className="shrink-0" />

                              {email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}

                      <td>
                        <span
                          className={`badge gap-1 ${
                            role === "admin" ? "badge-primary" : "badge-ghost"
                          }`}
                        >
                          {role === "admin" ? <FaUserShield /> : <FaUser />}

                          {role === "admin" ? "Administrator" : "Customer"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`badge ${
                            status === "active"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {status === "active" ? "Active" : "Blocked"}
                        </span>
                      </td>

                      {/* PROVIDER */}

                      <td>
                        <span className="text-sm text-base-content/70">
                          {formatProvider(item?.provider)}
                        </span>
                      </td>

                      {/* LAST LOGIN */}

                      <td>
                        <span className="whitespace-nowrap text-sm text-base-content/70">
                          {formatDate(item?.lastLogin)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActionError("");
                              setSelectedUser(item);
                            }}
                            className="btn btn-ghost btn-sm"
                          >
                            View
                          </button>

                          <div className="dropdown dropdown-end">
                            <button
                              type="button"
                              tabIndex={0}
                              className="btn btn-square btn-ghost btn-sm"
                              aria-label={`Actions for ${name}`}
                            >
                              ⋮
                            </button>

                            <ul
                              tabIndex={0}
                              className="dropdown-content menu z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
                            >
                              <li>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError("");
                                    setSelectedUser(item);
                                  }}
                                >
                                  View / Manage
                                </button>
                              </li>

                              <li>
                                <button
                                  type="button"
                                  disabled={current || actionLoading}
                                  onClick={() => handleRoleChange(item)}
                                >
                                  <FaUserShield />
                                  Make {role === "admin" ? "Customer" : "Admin"}
                                </button>
                              </li>

                              <li>
                                <button
                                  type="button"
                                  disabled={current || actionLoading}
                                  onClick={() => handleStatusChange(item)}
                                >
                                  {status === "active" ? (
                                    <FaUserSlash />
                                  ) : (
                                    <FaCheckCircle />
                                  )}

                                  {status === "active"
                                    ? "Block User"
                                    : "Activate User"}
                                </button>
                              </li>

                              <li>
                                <button
                                  type="button"
                                  disabled={current || actionLoading}
                                  className="text-error"
                                  onClick={() => handleDeleteUser(item)}
                                >
                                  <FaTrash />
                                  Delete User
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* GRID VIEW */}
      {/* ====================================================== */}

      {paginatedUsers.length > 0 && viewMode === "grid" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedUsers.map((item) => {
            const name = getUserName(item);
            const email = getUserEmail(item);
            const role = getUserRole(item);
            const status = getUserStatus(item);
            const current = isCurrentUser(item);

            return (
              <div
                key={getUserId(item)}
                className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {item?.photo ? (
                      <div className="avatar shrink-0">
                        <div className="h-14 w-14 rounded-full">
                          <img src={item.photo} alt={name} />
                        </div>
                      </div>
                    ) : (
                      <div className="avatar placeholder shrink-0">
                        <div className="h-14 w-14 rounded-full bg-primary text-primary-content">
                          <span className="text-lg font-bold">
                            {getInitial(name)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{name}</h3>

                      <p className="truncate text-xs text-base-content/50">
                        {email}
                      </p>
                    </div>
                  </div>

                  {current && (
                    <span className="badge badge-primary badge-sm shrink-0">
                      You
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`badge ${
                      role === "admin" ? "badge-primary" : "badge-ghost"
                    }`}
                  >
                    {role === "admin" ? "Administrator" : "Customer"}
                  </span>

                  <span
                    className={`badge ${
                      status === "active" ? "badge-success" : "badge-error"
                    }`}
                  >
                    {status === "active" ? "Active" : "Blocked"}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-base-content/60">
                  <p>
                    <span className="font-medium">Provider:</span>{" "}
                    {formatProvider(item?.provider)}
                  </p>

                  <p>
                    <span className="font-medium">Email verified:</span>{" "}
                    {item?.emailVerified ? "Yes" : "No"}
                  </p>

                  <p>
                    <span className="font-medium">Last login:</span>{" "}
                    {formatDate(item?.lastLogin)}
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setSelectedUser(item);
                    }}
                    className="btn btn-primary btn-sm min-w-0 flex-1"
                  >
                    Manage
                  </button>

                  <button
                    type="button"
                    disabled={current || actionLoading}
                    onClick={() => handleDeleteUser(item)}
                    className="btn btn-error btn-outline btn-sm"
                    title="Delete user"
                    aria-label={`Delete ${name}`}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================== */}
      {/* PAGINATION */}
      {/* ====================================================== */}

      {totalUsers > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-base-content/60">
            Page{" "}
            <span className="font-semibold text-base-content">
              {safeCurrentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-base-content">
              {totalPages}
            </span>
          </p>

          <div className="join max-w-full overflow-x-auto">
            <button
              type="button"
              className="btn join-item"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              aria-label="Previous page"
            >
              <FaChevronLeft />
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`btn join-item ${
                  safeCurrentPage === page ? "btn-primary" : ""
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="btn join-item"
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              aria-label="Next page"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* USER DETAILS MODAL */}
      {/* ====================================================== */}

      {selectedUser && (
        <dialog open className="modal modal-bottom sm:modal-middle">
          <div className="modal-box max-h-[90vh] max-w-2xl overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
              disabled={actionLoading}
              aria-label="Close"
            >
              <FaTimes />
            </button>

            {/* MODAL HEADER */}

            <div className="flex items-center gap-4 pr-8">
              {selectedUser?.photo ? (
                <div className="avatar shrink-0">
                  <div className="h-16 w-16 rounded-full ring-2 ring-primary ring-offset-2">
                    <img
                      src={selectedUser.photo}
                      alt={getUserName(selectedUser)}
                    />
                  </div>
                </div>
              ) : (
                <div className="avatar placeholder shrink-0">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-content">
                    <span className="text-xl font-bold">
                      {getInitial(getUserName(selectedUser))}
                    </span>
                  </div>
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold sm:text-2xl">
                  {getUserName(selectedUser)}
                </h3>

                <p className="truncate text-sm text-base-content/60">
                  {getUserEmail(selectedUser)}
                </p>
              </div>
            </div>

            {/* ACTION ERROR */}

            {actionError && (
              <div className="alert alert-error mt-5">
                <FaExclamationTriangle />

                <span className="break-words">{actionError}</span>
              </div>
            )}

            {/* USER INFORMATION */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Role
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {getUserRole(selectedUser)}
                </p>
              </div>

              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Status
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {getUserStatus(selectedUser)}
                </p>
              </div>

              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Provider
                </p>

                <p className="mt-1 font-semibold">
                  {formatProvider(selectedUser?.provider)}
                </p>
              </div>

              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Email Verified
                </p>

                <p className="mt-1 font-semibold">
                  {selectedUser?.emailVerified ? "Yes" : "No"}
                </p>
              </div>

              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Created
                </p>

                <p className="mt-1 font-semibold">
                  {formatDate(selectedUser?.createdAt)}
                </p>
              </div>

              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Last Login
                </p>

                <p className="mt-1 font-semibold">
                  {formatDate(selectedUser?.lastLogin)}
                </p>
              </div>
            </div>

            {/* FIREBASE UID */}

            <div className="mt-4 rounded-xl bg-base-200 p-4">
              <p className="text-xs uppercase tracking-wide text-base-content/50">
                Firebase UID
              </p>

              <p className="mt-1 break-all font-mono text-xs">
                {selectedUser?.uid || "—"}
              </p>
            </div>

            {/* ACTIONS */}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                disabled={actionLoading || isCurrentUser(selectedUser)}
                onClick={() => handleRoleChange(selectedUser)}
                className="btn btn-primary w-full"
              >
                <FaUserShield />
                Make{" "}
                {getUserRole(selectedUser) === "admin" ? "Customer" : "Admin"}
              </button>

              <button
                type="button"
                disabled={actionLoading || isCurrentUser(selectedUser)}
                onClick={() => handleStatusChange(selectedUser)}
                className="btn btn-outline w-full"
              >
                {getUserStatus(selectedUser) === "active" ? (
                  <FaUserSlash />
                ) : (
                  <FaCheckCircle />
                )}

                {getUserStatus(selectedUser) === "active"
                  ? "Block User"
                  : "Activate User"}
              </button>

              <button
                type="button"
                disabled={actionLoading || isCurrentUser(selectedUser)}
                onClick={() => handleDeleteUser(selectedUser)}
                className="btn btn-error w-full"
              >
                <FaTrash />
                Delete
              </button>
            </div>

            {/* CURRENT ADMIN WARNING */}

            {isCurrentUser(selectedUser) && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 p-4 text-sm">
                <FaShieldAlt className="mt-0.5 shrink-0 text-warning" />

                <p>
                  This is your currently logged-in admin account. Role changes,
                  blocking and deletion are disabled for your own account.
                </p>
              </div>
            )}

            {/* CLOSE */}

            <div className="modal-action">
              <button
                type="button"
                onClick={closeModal}
                className="btn w-full sm:w-auto"
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
          </div>

          <form method="dialog" className="modal-backdrop" onClick={closeModal}>
            <button type="button">close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default AllUsers;
