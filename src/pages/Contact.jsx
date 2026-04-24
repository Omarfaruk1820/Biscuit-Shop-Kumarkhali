import React from "react";
import { useForm } from "react-hook-form";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import { useToast } from "../context/ToastProvider";

const Contact = () => {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // ================= SUBMIT =================
  const onSubmit = (data) => {
    console.log("CONTACT DATA:", data);

    addToast("Message sent successfully 🎉", "success");

    reset();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pt-24 pb-16 px-4">

      {/* ================= HEADER ================= */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-amber-600">
          Contact Us 📞
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-3">
          We are always here to help you. Send us a message anytime.
        </p>
      </div>

      {/* ================= MAIN SECTION ================= */}
      <div className="max-w-6xl mx-auto mt-12 grid md:grid-cols-2 gap-10">

        {/* ================= CONTACT INFO ================= */}
        <div className="space-y-6">

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-amber-500 text-xl" />
              <div>
                <h3 className="font-bold">Our Location</h3>
                <p className="text-gray-500 text-sm">
                  Kumarkhali, Kushtia, Bangladesh
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
            <div className="flex items-center gap-3">
              <FaPhone className="text-amber-500 text-xl" />
              <div>
                <h3 className="font-bold">Phone</h3>
                <p className="text-gray-500 text-sm">
                  +880 1822637989
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-amber-500 text-xl" />
              <div>
                <h3 className="font-bold">Email</h3>
                <p className="text-gray-500 text-sm">
                  mamun@biscuitshop.com
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
            <div className="flex items-center gap-3">
              <FaClock className="text-amber-500 text-xl" />
              <div>
                <h3 className="font-bold">Working Hours</h3>
                <p className="text-gray-500 text-sm">
                  Sat - Thu: 9:00 AM - 11:00 PM
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ================= CONTACT FORM ================= */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">

          <h2 className="text-2xl font-bold text-amber-600 mb-6">
            Send Message ✉️
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* NAME */}
            <div>
              <label className="text-sm font-medium">Name</label>
              <div className="flex items-center border rounded-lg px-3 mt-1">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full p-2 outline-none bg-transparent"
                  {...register("name", {
                    required: "Name is required",
                  })}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center border rounded-lg px-3 mt-1">
                <FaEnvelope className="text-gray-400" />
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full p-2 outline-none bg-transparent"
                  {...register("email", {
                    required: "Email is required",
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className="text-sm font-medium">Phone</label>
              <div className="flex items-center border rounded-lg px-3 mt-1">
                <FaPhone className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Your phone number"
                  className="w-full p-2 outline-none bg-transparent"
                  {...register("phone")}
                />
              </div>
            </div>

            {/* MESSAGE */}
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                rows="4"
                placeholder="Write your message..."
                className="w-full border rounded-lg p-3 mt-1 outline-none bg-transparent"
                {...register("message", {
                  required: "Message is required",
                })}
              ></textarea>

              {errors.message && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <FaPaperPlane />
              Send Message
            </button>

          </form>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <div className="max-w-6xl mx-auto mt-12">
        <iframe
          title="map"
          className="w-full h-64 rounded-xl shadow"
          src="https://www.google.com/maps/embed?pb=!1m18..."
          loading="lazy"
        ></iframe>
      </div>

    </div>
  );
};

export default Contact;