import React, { useContext, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../Auth/AuthProvider";
import {
  FaBox,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

// ================= FETCH ORDERS =================
const fetchOrders = async (status) => {
  const res = await axios.get(`${API}/orders/my?status=${status}`, {
    withCredentials: true,
  });

  return res.data?.data || [];
};

const OrderHistory = () => {
  const { user } = useContext(AuthContext);
  const [statusFilter, setStatusFilter] = useState("all");

  // ================= QUERY =================
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () => fetchOrders(statusFilter),
    enabled: !!user,
    staleTime: 0,
  });

  // ================= CANCEL ORDER =================
  const handleCancel = async (id) => {
    try {
      await axios.patch(
        `${API}/orders/cancel/${id}`,
        {},
        { withCredentials: true }
      );

      refetch();
    } catch (err) {
      alert(err?.response?.data?.message || "Cancel failed");
    }
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading your orders...
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500 font-semibold">
        Failed to load orders.
        <p className="text-xs mt-2 text-gray-400">
          {error?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* HEADER */}
      <h1 className="text-2xl md:text-3xl mt-10 font-bold text-center mb-6">
        📦 My Order History
      </h1>

      {/* ================= FILTER ================= */}
      <div className="flex gap-3 justify-center mb-8 flex-wrap">

        {["all", "pending", "shipped", "delivered"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              statusFilter === status
                ? "bg-amber-500 text-white"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}

      </div>

      {/* EMPTY STATE */}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No orders found
        </div>
      ) : (
        <div className="space-y-8">

          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
            >

              {/* ================= HEADER ================= */}
              <div className="flex flex-col md:flex-row md:justify-between gap-3 p-5 border-b">

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaBox />
                  <span>
                    Order ID:{" "}
                    <span className="font-medium">
                      {order._id?.slice(-8)}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendarAlt />
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                {/* STATUS */}
                <div className="flex items-center gap-2">

                  <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold
                    ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "shipped"
                        ? "bg-blue-100 text-blue-700"
                        : order.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {order.status || "pending"}
                  </span>

                  {/* CANCEL BUTTON */}
                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </div>

              {/* ================= CUSTOMER INFO ================= */}
              <div className="p-5 grid md:grid-cols-3 gap-4 text-sm border-b">

                <div className="flex items-center gap-2">
                  <FaUser className="text-gray-500" />
                  <span>{order.customer?.name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <FaPhone className="text-gray-500" />
                  <span>{order.customer?.phone || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 md:col-span-3">
                  <FaMapMarkerAlt className="text-gray-500" />
                  <span>
                    {order.customer?.address || "N/A"},{" "}
                    {order.customer?.city || "N/A"} -{" "}
                    {order.customer?.zip || "N/A"}
                  </span>
                </div>

                <div className="md:col-span-3 text-xs text-gray-500">
                  Payment Method:{" "}
                  <span className="font-medium">
                    {order.customer?.paymentMethod || "COD"}
                  </span>
                </div>

              </div>

              {/* ================= ITEMS ================= */}
              <div className="p-5 space-y-3">

                <h3 className="font-semibold text-sm text-gray-700">
                  Items
                </h3>

                <div className="space-y-2">

                  {order.items?.map((item, idx) => {
                    const price =
                      (Number(item.price) -
                        (Number(item.price) *
                          Number(item.discount || 0)) /
                          100) *
                      item.quantity;

                    return (
                      <div
                        key={idx}
                        className="flex justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>

                        <span className="font-medium">
                          ৳{price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* ================= TOTAL ================= */}
              <div className="p-5 border-t flex justify-between items-center bg-gray-50 dark:bg-gray-800">

                <span className="font-bold">Total Amount</span>

                <span className="text-lg font-bold text-amber-600">
                  ৳{order.total?.toFixed ? order.total.toFixed(2) : order.total || 0}
                </span>

              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default OrderHistory;