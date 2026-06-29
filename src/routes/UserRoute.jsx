import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../Auth/AuthProvider";

const UserRoute = ({ children }) => {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) {
    return <span className="loading loading-spinner"></span>;
  }

  if (user && role === "user") {
    return children;
  }

  return <Navigate to="/" replace />;
};

export default UserRoute;
