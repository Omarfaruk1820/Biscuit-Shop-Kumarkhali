import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";

const DashboardRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin
  if (user.role === "admin") {
    return <Navigate to="/dashboard/admin-dashboard" replace />;
  }

  // Normal user
  if (user.role === "user") {
    return <Navigate to="/dashboard/user-dashboard" replace />;
  }

  // Unknown role
  return <Navigate to="/" replace />;
};

export default DashboardRedirect;
