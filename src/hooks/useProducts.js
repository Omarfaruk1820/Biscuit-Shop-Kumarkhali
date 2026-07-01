import { useQuery } from "@tanstack/react-query";
import axiosPublic from "./axiosPublic";

const useProducts = () => {
  return useQuery({
    queryKey: ["products"],

    queryFn: async () => {
      const { data } = await axiosPublic.get("/products");

      return data.data;
    },

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 10,
  });
};

export default useProducts;
