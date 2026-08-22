import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaLock,
  FaShieldAlt,
  FaTruck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import axiosSecure from "../../hooks/axiosSecure";

import CustomerForm from "../checkout/CustomerForm";
import PaymentMethod from "../checkout/PaymentMethod";
import OrderSummary from "../checkout/OrderSummary";

// ============================================================
// API
// ============================================================

const fetchValidatedCart = async () => {
  const response = await axiosSecure.post("/carts/validate");

  return response?.data?.data ?? null;
};

const createOrder = async (orderData) => {
  const response = await axiosSecure.post("/orders", orderData);

  return response?.data ?? null;
};

// ============================================================
// CHECKOUT COMPONENT
// ============================================================

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ==========================================================
  // FORM
  // ==========================================================

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      area: "",
      note: "",
      paymentMethod: "cash_on_delivery",
      agree: false,
    },
    mode: "onTouched",
  });

  // ==========================================================
  // VALIDATED CART
  // ==========================================================

  const {
    data: cart,
    isLoading: isCartLoading,
    isError: isCartError,
    error: cartError,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["validated-cart"],
    queryFn: fetchValidatedCart,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ==========================================================
  // FORM VALIDATION
  // ==========================================================

  const validation = {
    name: {
      required: "Full name is required.",

      minLength: {
        value: 3,
        message: "Name must be at least 3 characters.",
      },

      maxLength: {
        value: 100,
        message: "Name cannot exceed 100 characters.",
      },
    },

    phone: {
      required: "Phone number is required.",

      pattern: {
        value: /^01[3-9]\d{8}$/,
        message: "Enter a valid Bangladeshi phone number.",
      },
    },

    address: {
      required: "Shipping address is required.",

      minLength: {
        value: 10,
        message: "Address must be at least 10 characters.",
      },

      maxLength: {
        value: 500,
        message: "Address cannot exceed 500 characters.",
      },
    },

    city: {
      required: "City is required.",

      maxLength: {
        value: 100,
        message: "City cannot exceed 100 characters.",
      },
    },

    area: {
      required: "Area is required.",

      maxLength: {
        value: 100,
        message: "Area cannot exceed 100 characters.",
      },
    },

    note: {
      maxLength: {
        value: 300,
        message: "Maximum 300 characters allowed.",
      },
    },

    agree: {
      required: "You must accept the Terms & Conditions.",
    },
  };

  // ==========================================================
  // CREATE ORDER MUTATION
  // ==========================================================

  const orderMutation = useMutation({
    mutationFn: createOrder,

    onSuccess: async (response) => {
      // ------------------------------------------------------
      // Invalidate cart-related queries
      // ------------------------------------------------------

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["cart"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["cart-count"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["cart-summary"],
        }),

        // queryClient.invalidateQueries({
        //   queryKey: ["validated-cart"],
        // }),
      ]);

      // ------------------------------------------------------
      // Reset checkout form
      // ------------------------------------------------------

      reset();

      // ------------------------------------------------------
      // Extract order data
      // ------------------------------------------------------

      const order =
        response?.data?.order ?? response?.order ?? response?.data ?? null;

      const orderId =
        response?.data?.orderId ??
        response?.data?._id ??
        response?.data?.id ??
        response?.orderId ??
        response?.order?._id ??
        response?.order?.id ??
        order?._id ??
        order?.id ??
        null;

      // ------------------------------------------------------
      // Navigate to success page
      // ------------------------------------------------------

      navigate("/success", {
        replace: true,

        state: {
          orderId,
          order,
          response,
          message:
            response?.message || "Your order has been placed successfully.",
        },
      });
    },

    onError: (error) => {
      console.error("Create order error:", error);

      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to place your order. Please try again.";

      // ------------------------------------------------------
      // Authentication error
      // ------------------------------------------------------

      if (status === 401) {
        window.alert("Your session has expired. Please login again.");

        navigate("/login", {
          replace: true,
          state: {
            from: "/checkout",
          },
        });

        return;
      }

      // ------------------------------------------------------
      // General error
      // ------------------------------------------------------

      window.alert(message);
    },
  });

  // ==========================================================
  // SUBMIT ORDER
  // ==========================================================

  const onSubmit = (formData) => {
    // Prevent duplicate submission
    if (orderMutation.isPending) {
      return;
    }

    // Validate cart
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      window.alert(
        "Your cart is empty. Please add products before placing your order.",
      );

      return;
    }

    // --------------------------------------------------------
    // Customer information
    // --------------------------------------------------------

    const customer = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      area: formData.area.trim(),
      note: formData.note?.trim() || "",
    };

    // --------------------------------------------------------
    // Final order payload
    // --------------------------------------------------------

    const orderData = {
      customer,
      paymentMethod: formData.paymentMethod,
    };

    // --------------------------------------------------------
    // Create order
    // --------------------------------------------------------

    orderMutation.mutate(orderData);
  };

  const placingOrder = orderMutation.isPending;

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-base-100 rounded-3xl border border-base-300 shadow-xl p-10 text-center">
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>

          <h2 className="text-2xl font-bold mt-6">Preparing Your Checkout</h2>

          <p className="text-base-content/60 mt-3 leading-6">
            We are checking your cart and making sure all products are
            available.
          </p>

          <div className="flex justify-center items-center gap-2 mt-6 text-sm text-base-content/50">
            <FaShieldAlt />
            Secure checkout
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CART ERROR
  // ==========================================================

  if (isCartError) {
    const errorMessage =
      cartError?.response?.data?.message ||
      cartError?.message ||
      "We could not load your cart.";

    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-base-100 rounded-3xl border border-base-300 shadow-xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mt-6">
            Unable to Load Checkout
          </h2>

          <p className="text-base-content/60 mt-4 leading-7">{errorMessage}</p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => refetchCart()}
              className="btn btn-primary"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // EMPTY CART
  // ==========================================================

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-base-100 rounded-3xl border border-base-300 shadow-xl p-8 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>

          <h2 className="text-3xl font-bold mt-6">Your Cart is Empty</h2>

          <p className="text-base-content/60 mt-4 leading-7">
            Looks like you haven't added anything to your cart yet. Browse our
            delicious products and add something you love.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
            >
              <FaArrowLeft />
              Go Back
            </button>

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="btn btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CHECKOUT PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-base-200 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================================================== */}
        {/* BACK BUTTON */}
        {/* ================================================== */}

        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm gap-2 px-0 hover:bg-transparent"
          >
            <FaArrowLeft />
            Back to Shopping
          </button>
        </div>

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
                <FaTruck />
                Fast & Reliable Delivery
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Checkout
              </h1>

              <p className="text-base-content/60 mt-3 max-w-2xl leading-7">
                Complete your order with your delivery information and preferred
                payment method.
              </p>
            </div>

            {/* Secure Checkout */}

            <div className="hidden sm:flex items-center gap-3 bg-base-100 border border-base-300 rounded-2xl px-4 py-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <FaShieldAlt />
              </div>

              <div>
                <p className="font-semibold text-sm">Secure Checkout</p>

                <p className="text-xs text-base-content/50 mt-1">
                  Your information is protected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* CHECKOUT FORM */}
        {/* ================================================== */}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
            {/* ================================================= */}
            {/* LEFT SIDE */}
            {/* ================================================= */}

            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* ================================================= */}
              {/* DELIVERY INFORMATION */}
              {/* ================================================= */}

              <section className="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-7 py-5 border-b border-base-300">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <FaTruck />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        Delivery Information
                      </h2>

                      <p className="text-sm text-base-content/50 mt-1">
                        Where should we deliver your order?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <CustomerForm
                    register={register}
                    errors={errors}
                    validation={validation}
                  />
                </div>
              </section>

              {/* ================================================= */}
              {/* PAYMENT METHOD */}
              {/* ================================================= */}

              <section className="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-7 py-5 border-b border-base-300">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-success/10 text-success flex items-center justify-center">
                      <FaLock />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">Payment Method</h2>

                      <p className="text-sm text-base-content/50 mt-1">
                        Choose how you would like to pay.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <PaymentMethod register={register} errors={errors} />
                </div>
              </section>

              {/* ================================================= */}
              {/* TRUST FEATURES */}
              {/* ================================================= */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-base-100 rounded-2xl border border-base-300 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <FaLock className="text-primary" />
                  </div>

                  <p className="font-semibold text-sm">Secure Checkout</p>

                  <p className="text-xs text-base-content/50 mt-1 leading-5">
                    Your personal information stays protected.
                  </p>
                </div>

                <div className="bg-base-100 rounded-2xl border border-base-300 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <FaTruck className="text-primary" />
                  </div>

                  <p className="font-semibold text-sm">Reliable Delivery</p>

                  <p className="text-xs text-base-content/50 mt-1 leading-5">
                    Your order will be delivered to your address.
                  </p>
                </div>

                <div className="bg-base-100 rounded-2xl border border-base-300 p-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                    <FaCheckCircle className="text-success" />
                  </div>

                  <p className="font-semibold text-sm">Quality Products</p>

                  <p className="text-xs text-base-content/50 mt-1 leading-5">
                    Carefully packed for a better experience.
                  </p>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* RIGHT SIDE */}
            {/* ================================================= */}

            <div className="lg:col-span-5 xl:col-span-4">
              <OrderSummary cart={cart} isSubmitting={placingOrder} />
            </div>
          </div>
        </form>

        {/* ================================================== */}
        {/* MOBILE SECURITY */}
        {/* ================================================== */}

        <div className="sm:hidden flex items-center justify-center gap-2 text-xs text-base-content/50 mt-8">
          <FaLock />
          Secure checkout • Your information is protected
        </div>
      </div>
    </div>
  );
};

export default Checkout;
