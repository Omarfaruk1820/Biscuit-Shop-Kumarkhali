import { useContext } from "react";
import { AuthContext } from "../Provider/AuthProvider";

const useRole = () => {
  const { role, loading } = useContext(AuthContext);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isUser: role === "user",
  };
};

export default useRole;
