
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-10">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* 🧁 BRAND */}
        <div>
          <h2 className="text-2xl font-bold text-white">BiscuitShop 🍪</h2>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            Freshly baked biscuits made with love and premium ingredients. We
            deliver happiness in every bite.
          </p>

          {/* SOCIAL */}
          <div className="flex gap-3 mt-5">
            <Link to="https://www.facebook.com/omar.faruk.469436">
              <p className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition">
                {" "}
                <FaFacebookF />
              </p>
            </Link>
            <Link to="https://www.linkedin.com/in/md-omar-faruk-6a592b252">
              <p className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition">
                <FaInstagram />
              </p>
            </Link>
            <Link to="https://www.youtube.com">
              <p className="p-2 bg-gray-800 rounded-full hover:bg-red-600 transition">
                {" "}
                <FaYoutube />
              </p>
            </Link>
          </div>
        </div>

        {/* 🔗 QUICK LINKS */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Home</li>
            <li className="hover:text-white cursor-pointer">Shop</li>
            <li className="hover:text-white cursor-pointer">Categories</li>
            <li className="hover:text-white cursor-pointer">Offers</li>
            <li className="hover:text-white cursor-pointer">Contact</li>
          </ul>
        </div>

        {/* 📞 CONTACT */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">
            Contact Info
          </h3>

          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <FaMapMarkerAlt />  Rail Station, SonaBondhu Sorok, Kumarkhali,Kusthia, Bangladesh
            </p>
            <p className="flex items-center gap-2">
              <FaPhone /> +880 1822637989
            </p>
            <p className="flex items-center gap-2">
              <FaEnvelope /> support@biscuitshop.com
            </p>
          </div>
        </div>

        {/* 📩 NEWSLETTER */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Newsletter</h3>
          <p className="text-sm text-gray-400 mb-3">
            Subscribe to get latest offers & updates.
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 rounded-lg bg-gray-800 text-white outline-none"
            />

            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-gray-800 text-center py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} BiscuitShop. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
