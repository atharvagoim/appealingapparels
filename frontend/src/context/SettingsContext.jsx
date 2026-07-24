import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useApi } from "../api/client";
import { fetchSettings, updateSettingsApi } from "../api/settingsApi";

const SettingsContext = createContext();
const STORAGE_KEY = "site-settings";
// __CROP_HELPERS__
const DEF_CROP = { zoom: 1, x: 50, y: 50 };
const cropOf = (c) => ({
  zoom: Number(c?.zoom) || 1,
  x: c?.x == null ? 50 : Number(c.x),
  y: c?.y == null ? 50 : Number(c.y),
});

const DEFAULT_COVERS = [
  { image: "https://picsum.photos/seed/aa-cover-1/1600/2000?grayscale", link: "/shop", mobile: { zoom: 1, x: 50, y: 50 }, laptop: { zoom: 1, x: 50, y: 50 } },
  { image: "https://picsum.photos/seed/aa-cover-2/1600/2000?grayscale", link: "/shop", mobile: { zoom: 1, x: 50, y: 50 }, laptop: { zoom: 1, x: 50, y: 50 } },
  { image: "https://picsum.photos/seed/aa-cover-3/1600/2000?grayscale", link: "/shop", mobile: { zoom: 1, x: 50, y: 50 }, laptop: { zoom: 1, x: 50, y: 50 } },
];

const toStore = (s) =>
  typeof s === "string"
    ? { src: s, mobile: { ...DEF_CROP }, laptop: { ...DEF_CROP } }
    : { src: s?.src || "", mobile: cropOf(s?.mobile), laptop: cropOf(s?.laptop) };
const normalizeStore = (arr) => (Array.isArray(arr) ? arr.map(toStore) : []);

const DEFAULT_STORE = [
  { src: "https://picsum.photos/seed/aa-store-1/1200/900?grayscale", mobile: { ...DEF_CROP }, laptop: { ...DEF_CROP } },
  { src: "https://picsum.photos/seed/aa-store-2/1200/900?grayscale", mobile: { ...DEF_CROP }, laptop: { ...DEF_CROP } },
];

const DEFAULT_CATEGORIES = [
  { label: "T-Shirts", image: "https://picsum.photos/seed/aa-cat-tshirt/1400/900?grayscale", link: "/shop?category=T-Shirts" },
  { label: "Hoodies", image: "https://picsum.photos/seed/aa-cat-hoodie/1400/900?grayscale", link: "/shop?category=Hoodies" },
  { label: "Bottoms", image: "https://picsum.photos/seed/aa-cat-bottoms/1400/900?grayscale", link: "/shop?category=Bottoms" },
];

const DEFAULT_STORE_INFO = {
  address: "Model Town, Delhi, India",
  addressNote: "Easily find us in the heart of Model Town.",
  mapQuery: "",
  hoursLabel: "Open Every Day",
  hoursValue: "11:00 AM – 9:00 PM",
  mapsUrl: "",
};

const DEFAULT_ANNOUNCEMENT = {
  enabled: true,
  animated: false,
  bgColor: "#111111",
  bgGradient: "",
  textColor: "#ffffff",
  taglines: ["Complimentary shipping on orders over ₹1,499"],
};

/** "Follow us" banner on the homepage — every word of it is admin-editable. */
const DEFAULT_SOCIAL_FOLLOW = {
  enabled: true,
  platform: "Facebook",
  heading: "Follow us on Facebook",
  subtext: "Stay updated with new arrivals, exclusive offers & limited drops.",
  buttonLabel: "Visit our Facebook Page",
  url: "",
  accent: "#1a53e3",
  /** Three short proof points shown beside the call to action. */
  stats: [
    { icon: "users", value: "20K+", label: "Followers" },
    { icon: "bell", value: "Daily", label: "Updates" },
    { icon: "tag", value: "Exclusive", label: "Drops" },
  ],
};

/**
 * A rail the shop owner owns outright. `productIds` empty means "show
 * everything", so it's useful before anyone curates it.
 */
const DEFAULT_EXPLORE = {
  enabled: true,
  title: "Explore",
  subtitle: "",
  viewAllLabel: "View all",
  productIds: [],
};

const DEFAULT_FOOTER = {
  phone: "",
  email: "",
  socialLinks: [],
};

/**
 * The homepage sections, in the order they ship. Admin can drag these into
 * any order; anything added to the site later is appended automatically so a
 * new section never goes missing just because it isn't in a saved list.
 */
export const HOME_SECTIONS = [
  { key: "newArrivals", label: "New Arrivals" },
  { key: "shopByCategory", label: "Shop by Category" },
  { key: "bestSellers", label: "Best Sellers" },
  { key: "clearance", label: "Clearance Sale" },
  { key: "socialFollow", label: "Follow us" },
  { key: "explore", label: "Explore" },
  { key: "storeSection", label: "Visit our store" },
  { key: "featureStrip", label: "Shipping & support strip" },
];

const DEFAULT_HOME_ORDER = HOME_SECTIONS.map((s) => s.key);

const DEFAULT_SECTION_ORDER = {
  newArrivals: [],
  bestSellers: [],
  clearance: [],
};

// Accept legacy string covers or {image, link} objects.
const toCover = (c) =>
  typeof c === "string"
    ? { image: c, link: "/shop", mobile: { ...DEF_CROP }, laptop: { ...DEF_CROP } }
    : { image: c?.image || "", link: c?.link || "", mobile: cropOf(c?.mobile), laptop: cropOf(c?.laptop) };
const toCategory = (c) => ({
  label: c?.label || "",
  image: c?.image || "",
  link: c?.link || "/shop",
  mobile: cropOf(c?.mobile),
  laptop: cropOf(c?.laptop),
});
const normalizeCategories = (arr) => (Array.isArray(arr) ? arr.map(toCategory) : DEFAULT_CATEGORIES);
const normalizeCovers = (arr) =>
  Array.isArray(arr) && arr.length ? arr.map(toCover) : DEFAULT_COVERS;

function initialLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        coverImages: normalizeCovers(parsed.coverImages),
        storeImages: parsed.storeImages ? normalizeStore(parsed.storeImages) : DEFAULT_STORE,
        categories: normalizeCategories(parsed.categories),
        clearanceSaleEnabled: !!parsed.clearanceSaleEnabled,
        clearanceSaleEndsAt: parsed.clearanceSaleEndsAt || null,
        storeInfo: { ...DEFAULT_STORE_INFO, ...(parsed.storeInfo || {}) },
        announcement: { ...DEFAULT_ANNOUNCEMENT, ...(parsed.announcement || {}) },
        socialFollow: { ...DEFAULT_SOCIAL_FOLLOW, ...(parsed.socialFollow || {}) },
        exploreSection: { ...DEFAULT_EXPLORE, ...(parsed.exploreSection || {}) },
        homeSectionOrder: parsed.homeSectionOrder || DEFAULT_HOME_ORDER,
        footer: { ...DEFAULT_FOOTER, ...(parsed.footer || {}) },
        sectionOrder: { ...DEFAULT_SECTION_ORDER, ...(parsed.sectionOrder || {}) },
      };
    }
  } catch {
    /* ignore */
  }
  return {
    coverImages: DEFAULT_COVERS,
    storeImages: DEFAULT_STORE,
    categories: DEFAULT_CATEGORIES,
    clearanceSaleEnabled: false,
    clearanceSaleEndsAt: null,
    storeInfo: DEFAULT_STORE_INFO,
    socialFollow: DEFAULT_SOCIAL_FOLLOW,
    exploreSection: DEFAULT_EXPLORE,
    homeSectionOrder: DEFAULT_HOME_ORDER,
    announcement: DEFAULT_ANNOUNCEMENT,
    footer: DEFAULT_FOOTER,
    sectionOrder: DEFAULT_SECTION_ORDER,
  };
}

/**
 * Site-wide visual settings (cover slideshow + shop-by-category tiles).
 * Dual-mode: API (Mongo, shared) when VITE_API_URL is set, else localStorage.
 * Cover images are { image, link } — each cover can link somewhere.
 */
export function SettingsProvider({ children }) {
  const local = useApi
    ? {
        coverImages: [],
        storeImages: [],
        categories: [],
        clearanceSaleEnabled: false,
        clearanceSaleEndsAt: null,
        storeInfo: DEFAULT_STORE_INFO,
        socialFollow: DEFAULT_SOCIAL_FOLLOW,
        exploreSection: DEFAULT_EXPLORE,
        homeSectionOrder: DEFAULT_HOME_ORDER,
        announcement: DEFAULT_ANNOUNCEMENT,
        footer: DEFAULT_FOOTER,
        sectionOrder: DEFAULT_SECTION_ORDER,
      }
    : initialLocal();
  const [coverImages, setCoverImagesState] = useState(local.coverImages);
  const [storeImages, setStoreImagesState] = useState(local.storeImages);
  const [categories, setCategoriesState] = useState(local.categories);
  const [sizeChartImage, setSizeChartState] = useState(local.sizeChartImage || "");
  const [clearanceSaleEnabled, setClearanceSaleEnabledState] = useState(!!local.clearanceSaleEnabled);
  const [clearanceSaleEndsAt, setClearanceSaleEndsAtState] = useState(local.clearanceSaleEndsAt || null);
  const [storeInfo, setStoreInfoState] = useState(local.storeInfo || DEFAULT_STORE_INFO);
  const [socialFollow, setSocialFollowState] = useState(
    local.socialFollow || DEFAULT_SOCIAL_FOLLOW
  );
  const [exploreSection, setExploreState] = useState(
    local.exploreSection || DEFAULT_EXPLORE
  );
  const [homeSectionOrder, setHomeOrderState] = useState(
    local.homeSectionOrder || DEFAULT_HOME_ORDER
  );
  const [announcement, setAnnouncementState] = useState(local.announcement || DEFAULT_ANNOUNCEMENT);
  const [footer, setFooterState] = useState(local.footer || DEFAULT_FOOTER);
  const [sectionOrder, setSectionOrderState] = useState(local.sectionOrder || DEFAULT_SECTION_ORDER);
  const [loading, setLoading] = useState(useApi);

  useEffect(() => {
    if (!useApi) return;
    let active = true;
    fetchSettings()
      .then((data) => {
        if (!active) return;
        setCoverImagesState(normalizeCovers(data.coverImages));
        setStoreImagesState(data.storeImages ? normalizeStore(data.storeImages) : DEFAULT_STORE);
        setCategoriesState(normalizeCategories(data.categories));
        setSizeChartState(data.sizeChartImage || "");
        setClearanceSaleEnabledState(!!data.clearanceSaleEnabled);
        setClearanceSaleEndsAtState(data.clearanceSaleEndsAt || null);
        setStoreInfoState({
          address: data.storeAddress || DEFAULT_STORE_INFO.address,
          addressNote: data.storeAddressNote || DEFAULT_STORE_INFO.addressNote,
          hoursLabel: data.storeHoursLabel || DEFAULT_STORE_INFO.hoursLabel,
          hoursValue: data.storeHoursValue || DEFAULT_STORE_INFO.hoursValue,
          mapsUrl: data.storeMapsUrl || "",
          mapQuery: data.storeMapQuery || "",
        });
        setSocialFollowState({
          ...DEFAULT_SOCIAL_FOLLOW,
          ...(data.socialFollow || {}),
        });
        setExploreState({ ...DEFAULT_EXPLORE, ...(data.exploreSection || {}) });
        if (Array.isArray(data.homeSectionOrder) && data.homeSectionOrder.length) {
          setHomeOrderState(data.homeSectionOrder);
        }
        setAnnouncementState({
          enabled: data.announcementEnabled !== false,
          animated: !!data.announcementAnimated,
          bgColor: data.announcementBgColor || DEFAULT_ANNOUNCEMENT.bgColor,
          bgGradient: data.announcementBgGradient || "",
          textColor: data.announcementTextColor || DEFAULT_ANNOUNCEMENT.textColor,
          taglines:
            Array.isArray(data.announcementTaglines) && data.announcementTaglines.length
              ? data.announcementTaglines
              : DEFAULT_ANNOUNCEMENT.taglines,
        });
        setFooterState({
          phone: data.footerPhone || "",
          email: data.footerEmail || "",
          socialLinks: Array.isArray(data.footerSocialLinks) ? data.footerSocialLinks : [],
        });
        setSectionOrderState({
          newArrivals: Array.isArray(data.newArrivalsOrder) ? data.newArrivalsOrder : [],
          bestSellers: Array.isArray(data.bestSellersOrder) ? data.bestSellersOrder : [],
          clearance: Array.isArray(data.clearanceOrder) ? data.clearanceOrder : [],
        });
      })
      .catch(() => {
        if (!active) return;
        setCoverImagesState(DEFAULT_COVERS);
        setStoreImagesState(DEFAULT_STORE);
        setCategoriesState(DEFAULT_CATEGORIES);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (useApi) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        coverImages,
        storeImages,
        categories,
        sizeChartImage,
        clearanceSaleEnabled,
        clearanceSaleEndsAt,
        storeInfo,
        socialFollow,
        exploreSection,
        homeSectionOrder,
        announcement,
        footer,
        sectionOrder,
      })
    );
  }, [
    coverImages,
    storeImages,
    categories,
    sizeChartImage,
    clearanceSaleEnabled,
    clearanceSaleEndsAt,
    storeInfo,
    socialFollow,
    exploreSection,
    homeSectionOrder,
    announcement,
    footer,
    sectionOrder,
  ]);

  const pendingRef = useRef({});
  const timerRef = useRef(null);
  const save = (patch) => {
    if (!useApi) return;
    pendingRef.current = { ...pendingRef.current, ...patch };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const payload = pendingRef.current;
      pendingRef.current = {};
      updateSettingsApi(payload).catch((err) =>
        console.error("Failed to save settings", err?.response?.data || err?.message)
      );
    }, 500);
  };

  /* ---------- cover images ({ image, link }) ---------- */
  const setCoverImages = (images) => {
    setCoverImagesState(images);
    save({ coverImages: images });
  };
  const addCoverImage = (image, link = "") => {
    const clean = (image || "").trim();
    if (!clean) return;
    setCoverImages([...coverImages, { image: clean, link: (link || "").trim() }]);
  };
  const updateCoverImage = (index, patch) => {
    setCoverImages(coverImages.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const updateCoverCrop = (index, device, crop) => {
    setCoverImages(coverImages.map((c, i) => (i === index ? { ...c, [device]: { ...c[device], ...crop } } : c)));
  };
  const removeCoverImage = (index) => {
    setCoverImages(coverImages.filter((_, i) => i !== index));
  };
  const moveCoverImage = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= coverImages.length) return;
    const next = [...coverImages];
    [next[index], next[to]] = [next[to], next[index]];
    setCoverImages(next);
  };
  const resetCovers = () => setCoverImages(DEFAULT_COVERS);

  /* ---------- store images ---------- */
  const setStoreImages = (images) => {
    setStoreImagesState(images);
    save({ storeImages: images });
  };
  const addStoreImage = (image) => {
    const clean = (image || "").trim();
    if (!clean) return;
    setStoreImages([...storeImages, { src: clean, mobile: { ...DEF_CROP }, laptop: { ...DEF_CROP } }]);
  };
  const updateStoreCrop = (index, device, crop) => {
    setStoreImages(
      storeImages.map((s, i) => (i === index ? { ...s, [device]: { ...s[device], ...crop } } : s))
    );
  };
  const removeStoreImage = (index) => {
    setStoreImages(storeImages.filter((_, i) => i !== index));
  };
  const moveStoreImage = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= storeImages.length) return;
    const next = [...storeImages];
    [next[index], next[to]] = [next[to], next[index]];
    setStoreImages(next);
  };
  const resetStoreImages = () => setStoreImages(DEFAULT_STORE);

  /* ---------- shop-by-category tiles ---------- */
  const setCategories = (cats) => {
    setCategoriesState(cats);
    save({ categories: cats });
  };
  const addCategory = () =>
    setCategories([...categories, { label: "New category", image: "", link: "/shop" }]);
  const updateCategory = (index, patch) =>
    setCategories(categories.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const updateCategoryCrop = (index, device, crop) =>
    setCategories(categories.map((c, i) => (i === index ? { ...c, [device]: { ...c[device], ...crop } } : c)));
  const removeCategory = (index) =>
    setCategories(categories.filter((_, i) => i !== index));
  const moveCategory = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= categories.length) return;
    const next = [...categories];
    [next[index], next[to]] = [next[to], next[index]];
    setCategories(next);
  };
  const resetCategories = () => setCategories(DEFAULT_CATEGORIES);

  /* ---------- size chart (single generic image) ---------- */
  const setSizeChartImage = (url) => {
    const clean = (url || "").trim();
    setSizeChartState(clean);
    save({ sizeChartImage: clean });
  };

  /* ---------- clearance sale on/off + countdown ---------- */
  const setClearanceSaleEnabled = (enabled) => {
    setClearanceSaleEnabledState(enabled);
    save({ clearanceSaleEnabled: enabled });
  };
  const setClearanceSaleEndsAt = (isoOrNull) => {
    setClearanceSaleEndsAtState(isoOrNull);
    save({ clearanceSaleEndsAt: isoOrNull });
  };

  /* ---------- "Visit our store" info ---------- */
  const updateStoreInfo = (patch) => {
    const next = { ...storeInfo, ...patch };
    setStoreInfoState(next);
    save({
      storeAddress: next.address,
      storeAddressNote: next.addressNote,
      storeHoursLabel: next.hoursLabel,
      storeHoursValue: next.hoursValue,
      storeMapsUrl: next.mapsUrl,
      storeMapQuery: next.mapQuery,
    });
  };

  /* ---------- "Follow us" social banner ---------- */
  const updateSocialFollow = (patch) => {
    const next = { ...socialFollow, ...patch };
    setSocialFollowState(next);
    save({ socialFollow: next });
  };

  /* ---------- the free-form "Explore" rail ---------- */
  const updateExploreSection = (patch) => {
    const next = { ...exploreSection, ...patch };
    setExploreState(next);
    save({ exploreSection: next });
  };

  /* ---------- order of the homepage sections ---------- */
  const updateHomeSectionOrder = (keys) => {
    // Anything missing from the saved list is appended, so a section added to
    // the site later still appears.
    const next = [
      ...keys.filter((k) => DEFAULT_HOME_ORDER.includes(k)),
      ...DEFAULT_HOME_ORDER.filter((k) => !keys.includes(k)),
    ];
    setHomeOrderState(next);
    save({ homeSectionOrder: next });
  };

  /* ---------- announcement bar ---------- */
  const updateAnnouncement = (patch) => {
    const next = { ...announcement, ...patch };
    setAnnouncementState(next);
    save({
      announcementEnabled: next.enabled,
      announcementAnimated: next.animated,
      announcementBgColor: next.bgColor,
      announcementBgGradient: next.bgGradient,
      announcementTextColor: next.textColor,
      announcementTaglines: next.taglines,
    });
  };

  /* ---------- footer (contact + social links) ---------- */
  const updateFooter = (patch) => {
    const next = { ...footer, ...patch };
    setFooterState(next);
    save({
      footerPhone: next.phone,
      footerEmail: next.email,
      footerSocialLinks: next.socialLinks,
    });
  };
  const addSocialLink = () =>
    updateFooter({ socialLinks: [...footer.socialLinks, { platform: "Instagram", url: "" }] });
  const updateSocialLink = (index, patch) =>
    updateFooter({
      socialLinks: footer.socialLinks.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  const removeSocialLink = (index) =>
    updateFooter({ socialLinks: footer.socialLinks.filter((_, i) => i !== index) });

  /* ---------- homepage section product order ---------- */
  const updateSectionOrder = (key, ids) => {
    const next = { ...sectionOrder, [key]: ids };
    setSectionOrderState(next);
    save({
      newArrivalsOrder: next.newArrivals,
      bestSellersOrder: next.bestSellers,
      clearanceOrder: next.clearance,
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        loading,
        coverImages,
        setCoverImages,
        addCoverImage,
        updateCoverImage,
        updateCoverCrop,
        removeCoverImage,
        moveCoverImage,
        resetCovers,
        storeImages,
        setStoreImages,
        addStoreImage,
        updateStoreCrop,
        removeStoreImage,
        moveStoreImage,
        resetStoreImages,
        categories,
        addCategory,
        updateCategory,
        updateCategoryCrop,
        removeCategory,
        moveCategory,
        resetCategories,
        sizeChartImage,
        setSizeChartImage,
        clearanceSaleEnabled,
        setClearanceSaleEnabled,
        clearanceSaleEndsAt,
        setClearanceSaleEndsAt,
        storeInfo,
        updateStoreInfo,
        socialFollow,
        updateSocialFollow,
        exploreSection,
        updateExploreSection,
        homeSectionOrder,
        updateHomeSectionOrder,
        announcement,
        updateAnnouncement,
        footer,
        updateFooter,
        addSocialLink,
        updateSocialLink,
        removeSocialLink,
        sectionOrder,
        updateSectionOrder,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
