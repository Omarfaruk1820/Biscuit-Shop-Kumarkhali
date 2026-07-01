import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosSecure from "./axiosSecure";

const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosSecure.delete(`/users/${id}`);

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
};

export default useDeleteUser;
