import useRole from "./useRole";

const useAdmin = () => {
  const { isAdmin, loading } = useRole();

  return [isAdmin, loading];
};

export default useAdmin;
