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
    coverImages: { type: [String], default: [] },
    categories: { type: [categorySchema], default: [] },
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
