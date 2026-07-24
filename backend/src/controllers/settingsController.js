import Settings from "../models/Settings.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const DEFAULT_COVERS = [
  { image: "https://picsum.photos/seed/aa-cover-1/1600/2000?grayscale", link: "/shop" },
  { image: "https://picsum.photos/seed/aa-cover-2/1600/2000?grayscale", link: "/shop" },
  { image: "https://picsum.photos/seed/aa-cover-3/1600/2000?grayscale", link: "/shop" },
];

const DEFAULT_CATEGORIES = [
  { label: "T-Shirts", image: "https://picsum.photos/seed/aa-cat-tshirt/1400/900?grayscale", link: "/shop?category=T-Shirts" },
  { label: "Hoodies", image: "https://picsum.photos/seed/aa-cat-hoodie/1400/900?grayscale", link: "/shop?category=Hoodies" },
  { label: "Bottoms", image: "https://picsum.photos/seed/aa-cat-bottoms/1400/900?grayscale", link: "/shop?category=Bottoms" },
];

const DEF_CROP = { zoom: 1, x: 50, y: 50 };
const cropOf = (c) => ({
  zoom: Number(c?.zoom) || 1,
  x: c?.x == null ? 50 : Number(c.x),
  y: c?.y == null ? 50 : Number(c.y),
});
const toStore = (s) =>
  typeof s === "string"
    ? { src: s, mobile: { ...DEF_CROP }, laptop: { ...DEF_CROP } }
    : { src: s?.src || "", mobile: cropOf(s?.mobile), laptop: cropOf(s?.laptop) };

const DEFAULT_STORE = [
  "https://picsum.photos/seed/aa-store-1/1200/900?grayscale",
  "https://picsum.photos/seed/aa-store-2/1200/900?grayscale",
];

// Covers/categories accept legacy shapes; both carry per-device crops.
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
const toSocialLink = (s) => ({
  platform: s?.platform || "",
  url: s?.url || "",
});

async function getOrCreate() {
  let doc = await Settings.findOne({ key: "site" });
  if (!doc) {
    doc = await Settings.create({
      key: "site",
      coverImages: DEFAULT_COVERS,
      storeImages: DEFAULT_STORE,
      categories: DEFAULT_CATEGORIES,
    });
  }
  return doc;
}

/** GET /api/settings — public (storefront reads this). */
export const getSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  const json = doc.toJSON();
  json.coverImages = (json.coverImages || []).map(toCover);
  json.storeImages = (json.storeImages || []).map(toStore);
  json.categories = (json.categories || []).map(toCategory);
  json.clearanceSaleEnabled = !!json.clearanceSaleEnabled;
  json.clearanceSaleEndsAt = json.clearanceSaleEndsAt
    ? new Date(json.clearanceSaleEndsAt).toISOString()
    : null;
  json.announcementEnabled = json.announcementEnabled !== false;
  json.announcementAnimated = !!json.announcementAnimated;
  json.announcementTaglines = Array.isArray(json.announcementTaglines)
    ? json.announcementTaglines
    : [];
  json.footerSocialLinks = Array.isArray(json.footerSocialLinks)
    ? json.footerSocialLinks.map(toSocialLink)
    : [];
  res.json(json);
});

/** PUT /api/settings — admin only. */
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    coverImages,
    storeImages,
    categories,
    sizeChartImage,
    clearanceSaleEnabled,
    clearanceSaleEndsAt,
    storeAddress,
    storeAddressNote,
    storeHoursLabel,
    storeHoursValue,
    storeMapsUrl,
    storeMapQuery,
    socialFollow,
    exploreSection,
    homeSectionOrder,
    announcementEnabled,
    announcementAnimated,
    announcementBgColor,
    announcementBgGradient,
    announcementTextColor,
    announcementTaglines,
    footerPhone,
    footerEmail,
    footerSocialLinks,
    newArrivalsOrder,
    bestSellersOrder,
    clearanceOrder,
  } = req.body;
  const update = {};
  if (Array.isArray(coverImages)) update.coverImages = coverImages.map(toCover);
  if (Array.isArray(storeImages)) update.storeImages = storeImages.map(toStore);
  if (Array.isArray(categories)) update.categories = categories.map(toCategory);
  if (typeof sizeChartImage === "string") update.sizeChartImage = sizeChartImage;
  if (typeof clearanceSaleEnabled === "boolean") update.clearanceSaleEnabled = clearanceSaleEnabled;
  if (clearanceSaleEndsAt === null) update.clearanceSaleEndsAt = null;
  else if (typeof clearanceSaleEndsAt === "string" && clearanceSaleEndsAt) {
    const d = new Date(clearanceSaleEndsAt);
    if (!Number.isNaN(d.getTime())) update.clearanceSaleEndsAt = d;
  }
  if (typeof storeAddress === "string") update.storeAddress = storeAddress;
  if (typeof storeAddressNote === "string") update.storeAddressNote = storeAddressNote;
  if (typeof storeHoursLabel === "string") update.storeHoursLabel = storeHoursLabel;
  if (typeof storeHoursValue === "string") update.storeHoursValue = storeHoursValue;
  if (typeof storeMapsUrl === "string") update.storeMapsUrl = storeMapsUrl;
  if (typeof storeMapQuery === "string") update.storeMapQuery = storeMapQuery;
  if (socialFollow && typeof socialFollow === "object") update.socialFollow = socialFollow;
  if (exploreSection && typeof exploreSection === "object") {
    update.exploreSection = exploreSection;
  }
  if (Array.isArray(homeSectionOrder)) update.homeSectionOrder = homeSectionOrder;
  if (typeof announcementEnabled === "boolean") update.announcementEnabled = announcementEnabled;
  if (typeof announcementAnimated === "boolean") update.announcementAnimated = announcementAnimated;
  if (typeof announcementBgColor === "string") update.announcementBgColor = announcementBgColor;
  if (typeof announcementBgGradient === "string") update.announcementBgGradient = announcementBgGradient;
  if (typeof announcementTextColor === "string") update.announcementTextColor = announcementTextColor;
  if (Array.isArray(announcementTaglines))
    update.announcementTaglines = announcementTaglines.filter((t) => typeof t === "string");
  if (typeof footerPhone === "string") update.footerPhone = footerPhone;
  if (typeof footerEmail === "string") update.footerEmail = footerEmail;
  if (Array.isArray(footerSocialLinks))
    update.footerSocialLinks = footerSocialLinks.map(toSocialLink);
  if (Array.isArray(newArrivalsOrder))
    update.newArrivalsOrder = newArrivalsOrder.filter((id) => typeof id === "string");
  if (Array.isArray(bestSellersOrder))
    update.bestSellersOrder = bestSellersOrder.filter((id) => typeof id === "string");
  if (Array.isArray(clearanceOrder))
    update.clearanceOrder = clearanceOrder.filter((id) => typeof id === "string");

  const doc = await Settings.findOneAndUpdate(
    { key: "site" },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const json = doc.toJSON();
  json.coverImages = (json.coverImages || []).map(toCover);
  json.storeImages = (json.storeImages || []).map(toStore);
  json.categories = (json.categories || []).map(toCategory);
  json.clearanceSaleEnabled = !!json.clearanceSaleEnabled;
  json.clearanceSaleEndsAt = json.clearanceSaleEndsAt
    ? new Date(json.clearanceSaleEndsAt).toISOString()
    : null;
  json.announcementEnabled = json.announcementEnabled !== false;
  json.announcementAnimated = !!json.announcementAnimated;
  json.announcementTaglines = Array.isArray(json.announcementTaglines)
    ? json.announcementTaglines
    : [];
  json.footerSocialLinks = Array.isArray(json.footerSocialLinks)
    ? json.footerSocialLinks.map(toSocialLink)
    : [];
  res.json(json);
});
