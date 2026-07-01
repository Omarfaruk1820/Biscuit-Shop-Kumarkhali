import { useQuery } from "@tanstack/react-query";
import axiosSecure from "./axiosSecure";

const useCart = (email) => {
  return useQuery({
    queryKey: ["cart", email],

    enabled: !!email,

    queryFn: async () => {
      const { data } = await axiosSecure.get(`/cart/${email}`);

      return data.data;
    },
  });
};

export default useCart;
