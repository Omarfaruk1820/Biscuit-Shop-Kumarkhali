import { useQuery } from "@tanstack/react-query";
import axiosSecure from "./axiosSecure";

const useUsers = () => {
  return useQuery({
    queryKey: ["users"],

    queryFn: async () => {
      const { data } = await axiosSecure.get("/users");

      return data.data;
    },

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 10,

    retry: 2,

    refetchOnWindowFocus: false,
  });
};

export default useUsers;
