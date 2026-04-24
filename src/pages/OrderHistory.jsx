import React, { useContext } from "react";
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

const fetchOrders = async (email) => {
  const res = await axios.get(
    `http://localhost:5000/orders?email=${email}`
  );
  return res.data?.data || [];
};

const OrderHistory = () => {
  const { user } = useContext(AuthContext);

  const email = user?.email?.toLowerCase().trim();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", email],
    queryFn: () => fetchOrders(email),
    enabled: !!email,
  });

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* HEADER */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-10">
        📦 My Order History
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          No orders found
        </p>
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
                      {order._id.slice(-8)}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendarAlt />
                  <span>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold w-fit
                  ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "shipped"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* ================= CUSTOMER INFO ================= */}
              <div className="p-5 grid md:grid-cols-3 gap-4 text-sm border-b">

                <div className="flex items-center gap-2">
                  <FaUser className="text-gray-500" />
                  <span>{order.customer?.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <FaPhone className="text-gray-500" />
                  <span>{order.customer?.phone}</span>
                </div>

                <div className="flex items-center gap-2 md:col-span-3">
                  <FaMapMarkerAlt className="text-gray-500" />
                  <span>
                    {order.customer?.address},{" "}
                    {order.customer?.city} - {order.customer?.zip}
                  </span>
                </div>

                <div className="md:col-span-3 text-xs text-gray-500">
                  Payment Method:{" "}
                  <span className="font-medium">
                    {order.customer?.paymentMethod}
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
                  ৳{order.total}
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