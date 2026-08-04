import { useForm } from "react-hook-form";
// import { useQuery } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import axiosSecure from "../../hooks/axiosSecure";

const fetchValidatedCart = async () => {
  console.log(import.meta.env.VITE_API_URL);

  const { data } = await axiosSecure.post("/carts/validate");

  return data.data;
};

const Checkout = () => {
  // =============================================
  // React Hook Form
  // =============================================

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  // =============================================
  // React Query
  // =============================================

  const {
    data: cart,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["validated-cart"],
    queryFn: fetchValidatedCart,
  });

  // =============================================
  // Validation Rules
  // =============================================

  const validation = {
    name: {
      required: "Full name is required.",
      minLength: {
        value: 3,
        message: "Minimum 3 characters.",
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
        message: "Address is too short.",
      },
    },

    city: {
      required: "City is required.",
    },

    area: {
      required: "Area is required.",
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

  const placeOrder = async (orderData) => {
    const { data } = await axiosSecure.post("/orders", orderData, {
      withCredentials: true,
    });

    return data;
  };

  const orderMutation = useMutation({
    mutationFn: placeOrder,

    onSuccess: (response) => {
      alert(response.message || "Order placed successfully.");

      refetch();

      console.log("Order Success:", response);
    },

    onError: (error) => {
      console.error(error);

      const message =
        error?.response?.data?.message || "Failed to place order.";

      alert(message);
    },
  });

  const onSubmit = (formData) => {
    if (!cart) return;

    const orderData = {
      customer: {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        area: formData.area.trim(),
        note: formData.note?.trim() || "",
      },

      paymentMethod: formData.paymentMethod,
    };

    orderMutation.mutate(orderData);
  };

  const placingOrder = orderMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>

          <h2 className="text-2xl font-bold mt-6">Loading Checkout...</h2>

          <p className="text-gray-500 mt-2">
            Please wait while we validate your cart.
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl border p-8 text-center">
          <h2 className="text-2xl font-bold text-error">
            Failed to Load Checkout
          </h2>

          <p className="text-gray-500 mt-4">
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong."}
          </p>

          <button
            type="button"
            onClick={refetch}
            className="btn btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl border p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>

          <h2 className="text-3xl font-bold">Your Cart is Empty</h2>

          <p className="text-gray-500 mt-3">
            Add some products to your cart before proceeding to checkout.
          </p>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-primary mt-6"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  // =============================================
  // Final Return
  // =============================================

  return (
    <div className="min-h-screen bg-base-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold">Checkout</h1>

          <p className="text-gray-500 mt-2">
            Complete your order by providing your shipping information.
          </p>
        </div>

        {/* Checkout Form */}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side */}

            <div className="lg:col-span-2 space-y-8">
              <CustomerForm
                register={register}
                errors={errors}
                validation={validation}
              />

              <PaymentMethod register={register} errors={errors} />
            </div>

            {/* Right Side */}

            <div className="lg:col-span-1">
              <OrderSummary cart={cart} isSubmitting={placingOrder} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
