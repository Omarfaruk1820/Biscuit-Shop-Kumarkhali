import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../Auth/AuthProvider";

const DashboardRedirect = () => {
  const { role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (role === "admin") {
    return <Navigate to="/dashboard/admin-dashboard" replace />;
  }

  if (role === "user") {
    return <Navigate to="/dashboard/user-dashboard" replace />;
  }

  return <Navigate to="/" replace />;
};

export default DashboardRedirect;
