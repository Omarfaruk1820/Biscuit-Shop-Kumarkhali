

import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";

const DashboardLayout = () => {
  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      {/* ====================================================== */}
      {/* Drawer Toggle */}
      {/* ====================================================== */}

      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* ====================================================== */}
      {/* Main Content */}
      {/* ====================================================== */}

      <div className="drawer-content flex min-h-screen flex-col">
        {/* ====================================================== */}
        {/* Mobile Navbar */}
        {/* ====================================================== */}

        <header className="navbar sticky top-0 z-40 border-b border-base-300 bg-base-100 shadow-sm lg:hidden">
          <div className="flex-none">
            <label
              htmlFor="dashboard-drawer"
              className="btn btn-square btn-ghost"
              aria-label="Open Dashboard Sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary md:text-xl">
              Dashboard
            </h1>
          </div>
        </header>

        {/* ====================================================== */}
        {/* Page Content */}
        {/* ====================================================== */}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

   

      <div className="drawer-side z-50">
        <label
          htmlFor="dashboard-drawer"
          aria-label="Close Dashboard Sidebar"
          className="drawer-overlay"
        />

        <aside className="min-h-full w-72 border-r border-base-300 bg-base-100 shadow-xl">
          <DashboardSidebar />
        </aside>
      </div>
    </div>
  );
};

export default DashboardLayout;
