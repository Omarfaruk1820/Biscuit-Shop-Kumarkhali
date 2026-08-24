import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { AuthContext } from "../Auth/AuthProvider";

const UserRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/dashboard/admin-dashboard" replace />;
  }

  if (user.role !== "user") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default UserRoute;
