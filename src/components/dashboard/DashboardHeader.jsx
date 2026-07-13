import { useEffect, useState } from "react";
import { FaBell, FaCog, FaSearch, FaCalendarAlt } from "react-icons/fa";

const DashboardHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-base-100 rounded-2xl shadow-lg border border-base-300 p-5 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Side */}
        <div>
          <p className="text-sm text-gray-500 font-medium">Welcome back 👋</p>

          <h1 className="text-3xl lg:text-4xl font-bold mt-1">
            Admin Dashboard
          </h1>

          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <FaCalendarAlt />

            <span>{formattedDate}</span>

            <span>•</span>

            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Search */}
          <label className="input input-bordered flex items-center gap-2 w-full md:w-80">
            <FaSearch className="text-gray-400" />

            <input
              type="text"
              className="grow"
              placeholder="Search products, orders..."
            />
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Notification */}
            <button className="btn btn-circle btn-outline relative">
              <FaBell className="text-lg" />

              <span className="absolute -top-1 -right-1 badge badge-error badge-xs"></span>
            </button>

            {/* Settings */}
            <button className="btn btn-circle btn-outline">
              <FaCog className="text-lg" />
            </button>

            {/* Admin Profile */}
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost flex items-center gap-3 px-2"
              >
                <div className="avatar">
                  <div className="w-11 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src="https://i.pravatar.cc/150?img=12" alt="Admin" />
                  </div>
                </div>

                <div className="hidden sm:block text-left">
                  <h3 className="font-semibold leading-none">Admin</h3>

                  <p className="text-xs text-gray-500">Super Administrator</p>
                </div>
              </label>

              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-56 mt-3"
              >
                <li>
                  <a>My Profile</a>
                </li>

                <li>
                  <a>Settings</a>
                </li>

                <li>
                  <a>Notifications</a>
                </li>

                <div className="divider my-1"></div>

                <li>
                  <a className="text-error font-semibold">Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
