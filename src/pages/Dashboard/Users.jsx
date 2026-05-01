import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FaUserShield } from "react-icons/fa";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const Users = () => {
  const { addToast } = useToast();

  // ================= GET USERS =================
  const {
    data,
    refetch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get(`${API}/users`, {
        withCredentials: true,
      });
      return res.data?.data || [];
    },
  });

  const users = data || [];

  // ================= TOGGLE ROLE =================
  const toggleRole = async (user) => {
    try {
      const res = await axios.patch(
        `${API}/users/role/${user._id}`,
        {},
        { withCredentials: true }
      );

      if (res.data?.success) {
        const newRole = res.data?.newRole;

        addToast(
          `User is now ${newRole === "admin" ? "Admin 👑" : "User 👤"}`,
          "success"
        );

        refetch();
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update role ❌", "error");
    }
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg text-amber-500"></span>
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        Failed to load users ❌
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-amber-600">
          👥 Manage Users
        </h2>
        <p className="text-gray-500 text-sm md:text-base">
          Toggle Admin/User role easily
        </p>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto bg-white shadow rounded-xl">
        <table className="min-w-full text-sm">

          <thead className="bg-amber-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">#</th>
              <th className="py-3 px-4 text-left">User</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr
                key={user._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="py-3 px-4">{index + 1}</td>

                <td className="py-3 px-4 flex items-center gap-3">
                  <img
                    src={
                      user.photo ||
                      "https://i.ibb.co/4pDNDk1/avatar.png"
                    }
                    alt="user"
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <span className="font-medium">
                    {user.name || "User"}
                  </span>
                </td>

                <td className="py-3 px-4 text-gray-600">
                  {user.email}
                </td>

                <td className="py-3 px-4">
                  {user.role === "admin" ? (
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                      Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      User
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleRole(user)}
                    className={`px-3 py-1 text-white rounded text-xs transition ${
                      user.role === "admin"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-amber-500 hover:bg-amber-600"
                    }`}
                  >
                    {user.role === "admin"
                      ? "Remove Admin"
                      : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {users.map((user, index) => (
          <div
            key={user._id}
            className="bg-white shadow rounded-xl p-4 flex flex-col gap-3"
          >

            {/* Top */}
            <div className="flex items-center gap-3">
              <img
                src={
                  user.photo ||
                  "https://i.ibb.co/4pDNDk1/avatar.png"
                }
                alt="user"
                className="w-12 h-12 rounded-full object-cover border"
              />
              <div>
                <h4 className="font-semibold">
                  {user.name || "User"}
                </h4>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Role */}
            <div>
              {user.role === "admin" ? (
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                  Admin 👑
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  User 👤
                </span>
              )}
            </div>

            {/* Action */}
            <button
              onClick={() => toggleRole(user)}
              className={`w-full py-2 text-white rounded text-sm transition ${
                user.role === "admin"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              {user.role === "admin"
                ? "Remove Admin"
                : "Make Admin"}
            </button>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {users.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No users found 😔
        </div>
      )}

    </div>
  );
};

export default Users;