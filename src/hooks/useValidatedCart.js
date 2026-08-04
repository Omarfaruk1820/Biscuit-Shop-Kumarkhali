import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../Hooks/useAxiosSecure";
import { useContext } from "react";
import { AuthContext } from "../Provider/AuthProvider";

const useValidatedCart = () => {
  const axiosSecure = useAxiosSecure();
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: ["validated-cart", user?.email],
    enabled: !!user?.email,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await axiosSecure.post("/cart/validate");
      return data.data;
    },
  });
};

export default useValidatedCart;
