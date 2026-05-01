import React, { useState, useEffect } from "react";
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

const API = import.meta.env.VITE_API_URL;
const LIMIT = 8;

// ================= DEBOUNCE HOOK =================
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ================= FETCH =================
const fetchOrders = async ({ queryKey }) => {
  const [_key, { page, status, search }] = queryKey;

  const res = await axios.get(`${API}/orders`, {
    params: {
      page,
      limit: LIMIT,
      status,
      search: search?.trim() ? search : undefined,
    },
    withCredentials: true,
  });

  return res.data;
};

const AllOrder = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ================= DEBOUNCED SEARCH =================
  const debouncedSearch = useDebounce(search, 500);

  // reset page only when real search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // ================= QUERY =================
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["orders", { page, status: statusFilter, search: debouncedSearch }],
    queryFn: fetchOrders,
    keepPreviousData: true,
  });

  const orders = data?.data || [];
  const totalPages = data?.totalPages || 1;

  // ================= PRICE =================
  const getPrice = (item) => {
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    return price - (price * discount) / 100;
  };

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
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl mt-10 font-bold">
          📦 Admin Order Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          Manage all customer orders
        </p>
      </div>

      {/* FILTER + SEARCH */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">

        {/* FILTER */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "shipped", "delivered"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm rounded-full border transition ${
                statusFilter === s
                  ? "bg-amber-500 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT (FIXED) */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="Search phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded-lg w-full lg:w-72 focus:ring-2 focus:ring-amber-400 outline-none"
        />
      </div>

      {/* EMPTY */}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No orders found 😔
        </div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow p-5 border hover:shadow-lg transition"
              >

                {/* HEADER */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaBox className="text-amber-500" />
                    #{order._id?.slice(-6)}
                  </div>

                  <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* CUSTOMER */}
                <div className="space-y-2 text-sm border-b pb-3">

                  <div className="flex items-center gap-2">
                    <FaUser /> {order.customer?.name || "N/A"}
                  </div>

                  <div className="flex items-center gap-2">
                    <FaPhone /> {order.customer?.phone || "N/A"}
                  </div>

                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt />
                    {order.customer?.address || "N/A"}
                  </div>

                </div>

                {/* ITEMS */}
                <div className="mt-3 space-y-1 text-sm max-h-32 overflow-y-auto">

                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between">
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-3 border-t gap-2">

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaClock />
                    {new Date(order.createdAt).toLocaleString()}
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
          <div className="flex flex-wrap justify-center mt-8 gap-2">

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
                className={`px-3 py-2 border rounded ${
                  page === i + 1 ? "bg-amber-500 text-white" : ""
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
              Updating...
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AllOrder;