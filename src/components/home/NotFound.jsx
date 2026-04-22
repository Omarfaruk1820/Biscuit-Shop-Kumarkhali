import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHome, FaExclamationTriangle } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white px-4">
      
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-10 text-center border border-white/20">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <FaExclamationTriangle className="text-yellow-400 text-6xl animate-bounce" />
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold mb-3 tracking-wide">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl font-semibold mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-gray-300 mb-8 leading-relaxed">
          The page you're looking for doesn’t exist or has been moved.
          Please check the URL or go back to a safe page.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          
          {/* Go Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 font-semibold rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300"
          >
            <FaArrowLeft />
            Go Back
          </button>

          {/* Home */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg transition-all duration-300"
          >
            <FaHome />
            Back to Home
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-sm text-gray-400">
          © {new Date().getFullYear()} Your Company. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default NotFound;