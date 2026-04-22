import { useEffect, useState } from "react";
import demoData from "../data/productCard.json"; // create this file

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setProducts(demoData);
      setLoading(false);
    }, 500); // simulate loading
  }, []);

  return { products, loading };
};

export default useProducts;
