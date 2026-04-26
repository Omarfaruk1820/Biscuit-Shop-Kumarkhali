import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FaUserShield } from "react-icons/fa";
import { useToast } from "../../context/ToastProvider";

const Users = () => {
  const { addToast } = useToast();

  // ================= GET USERS =================
  const { data: users = [], refetch, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/users");
      return res.data?.data || [];
    },
  });

  // ================= MAKE ADMIN =================
  const handleMakeAdmin = async (id) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/users/admin/${id}`
      );

      if (res.data?.success) {
        addToast("User promoted to Admin 👑", "success");
        refetch();
      }
    } catch (error) {
      addToast("Failed to update role ❌", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-lg">
        Loading users...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-amber-600">
          👥 Manage Users
        </h2>
        <p className="text-gray-500">
          View all users and manage roles
        </p>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white shadow rounded-xl">

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
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3 px-4">{index + 1}</td>

                {/* USER INFO */}
                <td className="py-3 px-4 flex items-center gap-3">
                  <img
                    src={
                      user.photoURL ||
                      "https://i.ibb.co/4pDNDk1/avatar.png"
                    }
                    alt="user"
                    className="w-10 h-10 rounded-full border"
                  />
                  <span className="font-medium">
                    {user.name || "User"}
                  </span>
                </td>

                <td className="py-3 px-4">{user.email}</td>

                {/* ROLE */}
                <td className="py-3 px-4">
                  {user.role === "admin" ? (
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                      Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      User
                    </span>
                  )}
                </td>

                {/* ACTION */}
                <td className="py-3 px-4 text-center">
                  {user.role === "admin" ? (
                    <button
                      disabled
                      className="px-3 py-1 bg-green-500 text-white rounded text-xs cursor-not-allowed"
                    >
                      <FaUserShield className="inline mr-1" />
                      Admin
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleMakeAdmin(user._id)
                      }
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs"
                    >
                      Make Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default Users;