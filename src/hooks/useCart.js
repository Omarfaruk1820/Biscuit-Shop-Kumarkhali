// hooks/useCart.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useCart = (email) => {
  return useQuery({
    queryKey: ["cart", email],
    queryFn: async () => {
      if (!email) return [];

      const res = await axios.get(`http://localhost:5000/cart?email=${email}`);

      return res.data?.data || [];
    },
    enabled: !!email,
  });
};
