import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    link: { type: String, default: "/shop", trim: true },
  },
  { _id: false }
);

/**
 * Site-wide visual settings (a single shared document): the homepage cover
 * slideshow and the "Shop by category" tiles. Stored in Mongo so every
 * visitor/device sees the same thing (unlike the old localStorage approach).
 */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true, index: true },
    coverImages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    storeImages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    categories: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Master on/off switch for the homepage Clearance Sale section.
    clearanceSaleEnabled: { type: Boolean, default: false },
    // Countdown target for the Clearance Sale banner (null = no countdown shown).
    clearanceSaleEndsAt: { type: Date, default: null },
    // "Visit our store" section — editable in admin instead of hardcoded.
    storeAddress: { type: String, default: "Model Town, Delhi, India" },
    storeAddressNote: { type: String, default: "Easily find us in the heart of Model Town." },
    storeHoursLabel: { type: String, default: "Open Every Day" },
    storeHoursValue: { type: String, default: "11:00 AM – 9:00 PM" },
    storeMapsUrl: { type: String, default: "" },
    storeEnabled: { type: Boolean, default: true },
    // Exact pin for the embedded map — coordinates or a precise place name.
    storeMapQuery: { type: String, default: "" },

    // "Follow us" social banner on the homepage. Kept as one loose object
    // so new fields can be added without a migration.
    socialFollow: { type: mongoose.Schema.Types.Mixed, default: {} },

    /**
     * A free-form homepage rail the shop owner controls entirely: its title,
     * and which products appear. An empty product list means "everything",
     * so it's useful from the moment it's switched on.
     */
    exploreSection: { type: mongoose.Schema.Types.Mixed, default: {} },

    /** The order the homepage sections appear in, as a list of section keys. */
    homeSectionOrder: { type: [String], default: [] },
    // Top announcement bar — on/off, colours, messages and marquee motion,
    // all editable in admin instead of hardcoded.
    announcementEnabled: { type: Boolean, default: true },
    announcementAnimated: { type: Boolean, default: false },
    announcementBgColor: { type: String, default: "#111111" },
    // A CSS gradient string (e.g. "linear-gradient(90deg,#ff512f,#f09819)").
    // Empty = use the solid announcementBgColor instead.
    announcementBgGradient: { type: String, default: "" },
    announcementTextColor: { type: String, default: "#ffffff" },
    announcementTaglines: {
      type: [String],
      default: ["Complimentary shipping on orders over ₹1,499"],
    },
    // Footer contact + social links — editable in admin instead of .env.
    footerPhone: { type: String, default: "" },
    footerEmail: { type: String, default: "" },
    footerSocialLinks: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // "About us" page — editable in admin instead of hardcoded.
    aboutEyebrow: { type: String, default: "About us" },
    aboutTitle: { type: String, default: "Designed To Go Everywhere" },
    aboutBody: {
      type: String,
      default:
        "Appealing Apparels began with a simple idea — a bag should be as dependable as it is good-looking. Every piece we make is built to carry your day, from the morning commute to the weekend away.\n\nWe obsess over the details that matter: durable materials, roomy compartments, secure closures and clean, timeless design. No trends for the sake of trends — just well-made bags you'll reach for again and again.",
    },
    aboutImage: {
      type: String,
      default: "https://picsum.photos/seed/aa-about/1200/1500?grayscale",
    },
    aboutButtonLabel: { type: String, default: "Back to website" },

    // Login / signup page's left-side image panel (laptop only — always
    // hidden on phones regardless of this setting).
    // Login and Signup each get their own image/copy/accent — independent
    // panels, not shared. Laptop only; always hidden on phones regardless.
    authLoginImage: { type: String, default: "" },
    authLoginImageCrop: { type: mongoose.Schema.Types.Mixed, default: null },
    authLoginHeadline: { type: String, default: "Carry Better." },
    authLoginTagline: { type: String, default: "Designed for everyday movement." },
    authLoginAccent: { type: String, default: "#0a0a0a" },

    authSignupImage: { type: String, default: "" },
    authSignupImageCrop: { type: mongoose.Schema.Types.Mixed, default: null },
    authSignupHeadline: { type: String, default: "Carry Better." },
    authSignupTagline: { type: String, default: "Designed for everyday movement." },
    authSignupAccent: { type: String, default: "#0a0a0a" },

    // The homepage sign-in/sign-up popup gets its own separate image — not
    // shared with the Login/Signup pages above.
    authPopupImage: { type: String, default: "" },
    authPopupImageCrop: { type: mongoose.Schema.Types.Mixed, default: null },

    // Which admin account is the permanent, un-removable one in the Admin
    // Access panel. Blank means "fall back to the env-seeded ADMIN_EMAIL" —
    // set once someone actually moves the lock to a different account.
    lockedAdminEmail: { type: String, default: "" },

    // Quick-insert reply templates for the admin support chat.
    savedReplies: { type: [String], default: [] },

    // Shown in the storefront search bar's dropdown before anyone types
    // anything. Blank means "fall back to real categories and sections."
    searchSuggestions: { type: [String], default: [] },

    // Custom homepage-section titles (renamed in admin → Sections).
    sectionTitleNewArrivals: { type: String, default: "New Arrivals" },
    sectionTitleBestSellers: { type: String, default: "Best Sellers" },
    sectionTitleClearance: { type: String, default: "Clearance Sale" },

    /**
     * Per-section header style — text title, a full-width banner image, or no
     * header at all. One entry per homepage rail; "explore" also carries its
     * own title/subtitle already, this only controls how the header renders.
     */
    sectionHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        newArrivals: { mode: "text", bannerImage: "" },
        bestSellers: { mode: "text", bannerImage: "" },
        clearance: { mode: "text", bannerImage: "" },
        explore: { mode: "text", bannerImage: "" },
      },
    },
    // Explicit product order (product IDs) for each homepage section — set
    // by dragging cards in admin/sections. Missing/new products are
    // appended automatically; the first HOME_LIMIT are what actually show.
    newArrivalsOrder: { type: [String], default: [] },
    bestSellersOrder: { type: [String], default: [] },
    clearanceOrder: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        delete ret._id;
        delete ret.key;
        return ret;
      },
    },
  }
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
