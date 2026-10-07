import Hero from "../components/Hero.jsx";
import NewArrivals from "../components/NewArrivals.jsx";
import ShopByCategory from "../components/ShopByCategory.jsx";
import BestSellers from "../components/BestSellers.jsx";
import ClearanceSale from "../components/ClearanceSale.jsx";
import SocialFollow from "../components/SocialFollow.jsx";
import ExploreSection from "../components/ExploreSection.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import ReviewPrompt from "../components/ReviewPrompt.jsx";
// Login/signup popup — temporarily disabled. Re-enable by uncommenting
// this import and the <WelcomeAuthModal /> render below.
// import WelcomeAuthModal from "../components/WelcomeAuthModal.jsx";
import { useSettings, HOME_SECTIONS } from "../context/SettingsContext";

/** Every reorderable section, keyed the same way as the saved order. */
const SECTION_COMPONENTS = {
  newArrivals: NewArrivals,
  shopByCategory: ShopByCategory,
  bestSellers: BestSellers,
  clearance: ClearanceSale,
  // Renders both the "Follow us" pitch and the "Visit our store" info as one
  // combined two-column section — see SocialFollow.jsx.
  socialFollow: SocialFollow,
  explore: ExploreSection,
  featureStrip: FeatureStrip,
};

export default function Home() {
  const { homeSectionOrder } = useSettings();

  // Fall back to the shipped order, and append anything the saved list is
  // missing so a newly added section can't go unrendered.
  const keys = homeSectionOrder?.length
    ? homeSectionOrder
    : HOME_SECTIONS.map((s) => s.key);
  const ordered = [
    ...keys.filter((k) => SECTION_COMPONENTS[k]),
    ...Object.keys(SECTION_COMPONENTS).filter((k) => !keys.includes(k)),
  ];

  return (
    <main>
      {/* The hero always leads; everything below it is admin-orderable. */}
      <Hero />

      {ordered.map((key) => {
        const Section = SECTION_COMPONENTS[key];
        return <Section key={key} />;
      })}

      <ReviewPrompt />
      {/* <WelcomeAuthModal /> */}
    </main>
  );
}
