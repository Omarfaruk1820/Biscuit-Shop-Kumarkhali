import FeaturedProducts from "../components/home/FeaturedProducts";
import HeroSection from "../components/home/HeroSection";
import PromoBanner from "../components/home/PromoBanner";

import MarqueeBar from './../components/home/MarqueeBar';

const Home = () => {
  return (
    <div>
      <HeroSection></HeroSection>
      <FeaturedProducts></FeaturedProducts>
      <MarqueeBar></MarqueeBar>
      <PromoBanner></PromoBanner>
     
    </div>
  );
};

export default Home;
