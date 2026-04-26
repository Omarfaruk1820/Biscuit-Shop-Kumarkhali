// hooks/useAdmin.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../Auth/AuthProvider";

const useAdmin = () => {
  const { user } = useContext(AuthContext);

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:5000/users/admin/${user.email}`
      );
      return res.data?.admin;
    },
  });

  return [isAdmin, isLoading];
};

export default useAdmin;