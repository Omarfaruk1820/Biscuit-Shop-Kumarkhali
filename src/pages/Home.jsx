import FeaturedProducts from "../components/home/FeaturedProducts";
import HeroSection from "../components/home/HeroSection";
import PromoBanner from "../components/home/PromoBanner";
import ProductCard from "../components/products/ProductCard";

import MarqueeBar from './../components/home/MarqueeBar';

const Home = () => {
  return (
    <div>
      <HeroSection></HeroSection>
      <FeaturedProducts></FeaturedProducts>
      <MarqueeBar></MarqueeBar>
      <PromoBanner></PromoBanner>
      <ProductCard></ProductCard>
     
    </div>
  );
};

export default Home;
