import React, { useEffect, useState } from "react";
import {
  FaCreditCard,
  FaMoneyBillWave,
  FaShoppingBag,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastProvider";

const Checkout = () => {
  const { addToast } = useToast();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(stored);
  }, []);

  const totalPrice = cart.reduce((sum, item) => {
    const final =
      item.price - (item.price * (item.discount || 0)) / 100;
    return sum + final * item.quantity;
  }, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOrder = () => {
    if (!form.name || !form.phone || !form.address) {
      addToast("Please fill all required fields ❌", "error");
      return;
    }

    if (cart.length === 0) {
      addToast("Cart is empty 🛒", "warning");
      return;
    }

    const orderData = {
      customer: form,
      cart,
      paymentMethod,
      totalPrice,
      date: new Date(),
    };

    console.log("ORDER:", orderData);

    localStorage.removeItem("cart");

    addToast("Order placed successfully 🎉", "success");

    setTimeout(() => {
      navigate("/");
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-3 gap-8">

      {/* LEFT */}
      <div className="md:col-span-2 mt-10 space-y-6">

        <div className="bg-base-100 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">🏠 Shipping Address</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input name="name" placeholder="Full Name *" className="input input-bordered" onChange={handleChange}/>
            <input name="phone" placeholder="Phone *" className="input input-bordered" onChange={handleChange}/>
            <input name="city" placeholder="City" className="input input-bordered" onChange={handleChange}/>
            <input name="zip" placeholder="ZIP" className="input input-bordered" onChange={handleChange}/>
            <textarea name="address" placeholder="Full Address *" className="textarea textarea-bordered md:col-span-2" onChange={handleChange}/>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">💳 Payment</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
              <input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <FaMoneyBillWave /> Cash on Delivery
            </label>

            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
              <input type="radio" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
              <FaCreditCard /> Card Payment
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="bg-base-100 p-6 mt-10 rounded-2xl shadow h-fit">

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaShoppingBag /> Order Summary
        </h2>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {cart.map((item) => {
            const final =
              item.price - (item.price * (item.discount || 0)) / 100;

            return (
              <div key={item._id} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>৳{(final * item.quantity).toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-bold text-primary">
              ৳{(totalPrice + 50).toFixed(2)}
            </span>
          </div>
        </div>

        <button onClick={handleOrder} className="btn btn-primary w-full mt-6">
          Place Order 🚀
        </button>
      </div>
    </div>
  );
};

export default Checkout;