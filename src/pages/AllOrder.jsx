import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  FaBox,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaClock,
} from "react-icons/fa";

// ================= FETCH =================
const fetchOrders = async (page) => {
  const res = await axios.get(
    `http://localhost:5173/orders?page=${page}&limit=8`
  );

  return res.data;
};

const AllOrder = () => {
  const [page, setPage] = useState(1);

  // ================= QUERY =================
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => fetchOrders(page),

    // ✅ React Query v5 fix
    placeholderData: (prev) => prev,
  });

  // ================= SAFE DATA =================
  const orders = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  // ================= PRICE =================
  const getPrice = (item) => {
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    return price - (price * discount) / 100;
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading orders...
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500 font-semibold">
        Failed to load orders
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* HEADER */}
      <div className="text-center mt-10 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">
          📦 All Orders Dashboard
        </h1>
        <p className="text-gray-500 mt-2">
          All customer orders in one place
        </p>
      </div>

      {/* EMPTY STATE */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          No orders found
        </p>
      ) : (
        <>
          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-6">

            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow hover:shadow-xl transition p-5 border"
              >

                {/* HEADER */}
                <div className="flex justify-between items-center mb-3">

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaBox className="text-amber-500" />
                    <span>
                      Order #{order._id?.slice(-6)}
                    </span>
                  </div>

                  <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    {order.status || "pending"}
                  </span>

                </div>

                {/* CUSTOMER */}
                <div className="space-y-2 text-sm border-b pb-3">

                  <div className="flex items-center gap-2">
                    <FaUser className="text-amber-500" />
                    <span>{order.customer?.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaPhone className="text-green-500" />
                    <span>{order.customer?.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" />
                    <span>
                      {order.customer?.address}{" "}
                      {order.customer?.city}
                    </span>
                  </div>

                </div>

                {/* ITEMS */}
                <div className="mt-3 space-y-1 text-sm max-h-32 overflow-y-auto">

                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span className="text-gray-600">
                        ৳{(getPrice(item) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t">

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaClock />
                    <span>
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-amber-600">
                    <FaMoneyBillWave />
                    ৳{order.total}
                  </div>

                </div>

              </div>
            ))}

          </div>

          {/* PAGINATION */}
          <div className="flex justify-center mt-10 gap-2">

            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 border rounded ${
                  page === i + 1
                    ? "bg-amber-500 text-white"
                    : ""
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>

          </div>

          {/* FETCHING INDICATOR */}
          {isFetching && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Updating orders...
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AllOrder;