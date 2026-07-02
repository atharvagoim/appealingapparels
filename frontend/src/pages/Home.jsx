import Hero from "../components/Hero.jsx";
import NewArrivals from "../components/NewArrivals.jsx";
import ShopByCategory from "../components/ShopByCategory.jsx";
import BestSellers from "../components/BestSellers.jsx";
import Newsletter from "../components/Newsletter.jsx";

export default function Home() {
  return (
    <main>
      <Hero />
      <NewArrivals />
      <ShopByCategory />
      <BestSellers />
      <Newsletter />
    </main>
  );
}
