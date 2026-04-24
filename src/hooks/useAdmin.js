import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../Auth/AuthProvider";

const useAdmin = () => {
  const { user } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetch(`http://localhost:5000/users/admin/${user.email}`)
        .then((res) => res.json())
        .then((data) => {
          setIsAdmin(data.admin);
          setLoading(false);
        });
    }
  }, [user]);

  return [isAdmin, loading];
};

export default useAdmin;
