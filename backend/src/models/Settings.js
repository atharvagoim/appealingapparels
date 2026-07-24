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
    sizeChartImage: { type: String, default: "" },
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
