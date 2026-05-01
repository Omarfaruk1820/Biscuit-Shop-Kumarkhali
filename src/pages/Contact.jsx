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
    formState: { errors, isSubmitting },
  } = useForm();

  // ================= SUBMIT =================
  const onSubmit = async (data) => {
    try {
      console.log("CONTACT DATA:", data);

      // 👉 future: send API / email service here

      addToast("Message sent successfully 🎉", "success");
      reset();
    } catch (err) {
      addToast("Failed to send message ❌", "error");
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pt-24 pb-16 px-4">

      {/* ================= HEADER ================= */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-600">
          Contact Us 📞
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm md:text-base">
          আমরা সবসময় আপনার পাশে আছি। যেকোনো প্রশ্ন বা প্রয়োজন হলে আমাদের জানান।
        </p>
      </div>

      {/* ================= MAIN ================= */}
      <div className="max-w-6xl mx-auto mt-12 grid lg:grid-cols-2 gap-10">

        {/* ================= LEFT INFO ================= */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-5">

          {/* LOCATION */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-amber-500 text-xl mt-1" />
              <div>
                <h3 className="font-semibold">Our Location</h3>
                <p className="text-gray-500 text-sm">
                  Kumarkhali, Kushtia, Bangladesh
                </p>
              </div>
            </div>
          </div>

          {/* PHONE */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-start gap-3">
              <FaPhone className="text-amber-500 text-xl mt-1" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-gray-500 text-sm">
                  +880 1822-637989
                </p>
              </div>
            </div>
          </div>

          {/* EMAIL */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-start gap-3">
              <FaEnvelope className="text-amber-500 text-xl mt-1" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-gray-500 text-sm">
                  support@biscuitshop.com
                </p>
              </div>
            </div>
          </div>

          {/* HOURS */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-start gap-3">
              <FaClock className="text-amber-500 text-xl mt-1" />
              <div>
                <h3 className="font-semibold">Working Hours</h3>
                <p className="text-gray-500 text-sm">
                  Sat - Thu: 9:00 AM - 11:00 PM
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ================= FORM ================= */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow">

          <h2 className="text-xl md:text-2xl font-bold text-amber-600 mb-6">
            Send Message ✉️
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* NAME */}
            <div>
              <label className="text-sm font-medium">Name</label>
              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
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
              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
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
              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
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
                className="w-full border rounded-lg p-3 mt-1 outline-none focus:ring-2 focus:ring-amber-400 bg-transparent"
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
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <FaPaperPlane />
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>

          </form>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <div className="max-w-6xl mx-auto mt-12">
        <div className="rounded-2xl overflow-hidden shadow-lg border">

          <iframe
            title="Kumarkhali Map"
            className="w-full h-[250px] sm:h-[350px] md:h-[400px]"
            loading="lazy"
            allowFullScreen
            src="https://www.google.com/maps?q=Kumarkhali,Kushtia,Bangladesh&output=embed"
          ></iframe>

        </div>
      </div>
    </div>
  );
};

export default Contact;