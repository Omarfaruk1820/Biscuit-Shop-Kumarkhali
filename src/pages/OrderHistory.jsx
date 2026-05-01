import React, { useContext, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../Auth/AuthProvider";
import {
  FaBox,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useToast } from "../context/ToastProvider";

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
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");

  // ================= QUERY =================
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () => fetchOrders(statusFilter),
    enabled: !!user,
  });

  // ================= CANCEL =================
  const cancelMutation = useMutation({
    mutationFn: (id) =>
      axios.patch(`${API}/orders/cancel/${id}`, {}, { withCredentials: true }),

    onSuccess: () => {
      addToast("Order cancelled ❌", "success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },

    onError: () => {
      addToast("Cancel failed ❌", "error");
    },
  });

  // ================= STATUS STYLE =================
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-200 text-gray-700";
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
        Failed to load orders ❌
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

      {/* HEADER */}
      <h1 className="text-2xl md:text-3xl mt-10 font-bold text-center mb-6">
        📦 My Orders
      </h1>

      {/* FILTER */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {["all", "pending", "shipped", "delivered"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-sm rounded-full border transition ${
              statusFilter === status
                ? "bg-amber-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {/* EMPTY */}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No orders found 😔
        </div>
      ) : (
        <div className="space-y-6">

          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow rounded-2xl border overflow-hidden"
            >

              {/* HEADER */}
              <div className="flex flex-col md:flex-row md:justify-between gap-3 p-4 border-b">

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaBox />
                  #{order._id?.slice(-6)}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendarAlt />
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "N/A"}
                </div>

                <div className="flex items-center gap-2 flex-wrap">

                  <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  {order.status === "pending" && (
                    <button
                      onClick={() => cancelMutation.mutate(order._id)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </div>

              {/* CUSTOMER */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm border-b">

                <div className="flex items-center gap-2">
                  <FaUser /> {order.customer?.name || "N/A"}
                </div>

                <div className="flex items-center gap-2">
                  <FaPhone /> {order.customer?.phone || "N/A"}
                </div>

                <div className="flex items-center gap-2 md:col-span-3">
                  <FaMapMarkerAlt />
                  {order.customer?.address},{" "}
                  {order.customer?.city} - {order.customer?.zip}
                </div>

                <div className="md:col-span-3 text-xs text-gray-500">
                  Payment: {order.customer?.paymentMethod || "COD"}
                </div>

              </div>

              {/* ITEMS */}
              <div className="p-4 space-y-2">

                {order.items?.map((item, i) => {
                  const price =
                    (Number(item.price) -
                      (Number(item.price) *
                        Number(item.discount || 0)) /
                        100) *
                    item.quantity;

                  return (
                    <div
                      key={i}
                      className="flex justify-between text-sm bg-gray-50 p-2 rounded"
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

              {/* TOTAL */}
              <div className="p-4 border-t flex justify-between items-center bg-gray-50">

                <span className="font-semibold">Total</span>

                <span className="text-lg font-bold text-amber-600">
                  ৳
                  {order.total?.toFixed
                    ? order.total.toFixed(2)
                    : order.total || 0}
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