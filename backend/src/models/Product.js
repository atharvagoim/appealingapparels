import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true, uppercase: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    // Garment measurements in inches, shown beside the size picker. Optional —
    // leave at 0 and the chips simply don't render.
    chest: { type: Number, default: 0, min: 0 },
    length: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/**
 * An optional colourway. Each carries its own photos and its own stock, so
 * "Navy sold out, Black still available" is representable.
 *
 * When the product is sized the stock lives in `sizes`; when it isn't (a bag,
 * say) the flat `stock` number is used instead.
 */
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    swatch: { type: String, default: "#111111", trim: true },
    images: { type: [String], default: [] },
    sizes: { type: [sizeSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    /**
     * The colourway shown on the shop grid and as the opening shot on the
     * product page. Exactly one should carry it; if none does, the first is
     * treated as primary.
     */
    primary: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Unique catalogue/SKU-style code — admin can set their own or one is
    // auto-generated. Shown in admin search, on the product page, and on
    // invoices.
    code: { type: String, unique: true, sparse: true, trim: true, uppercase: true, index: true },
    category: { type: String, required: true, trim: true, default: "Uncategorised" },
    categories: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    description: { type: String, default: "", trim: true },
    // Bullet lists rendered as dropdowns on the product page.
    highlights: { type: [String], default: [] },
    fabricCare: { type: [String], default: [] },
    images: { type: [String], default: [] },
    sizes: { type: [sizeSchema], default: [] },

    /**
     * Not everything is sized — a bag has one size, a kurti has several. When
     * false the size picker is hidden and `stock` is used instead of `sizes`.
     */
    hasSizes: { type: Boolean, default: true },
    stock: { type: Number, default: 0, min: 0 },

    /** Empty means the product comes in one colourway and uses `images`. */
    colors: { type: [colorSchema], default: [] },
    /**
     * Parcel dimensions, needed by the courier when a shipment is booked.
     * Weight is in kilograms and the box measurements in centimetres, which is
     * what Shiprocket's API expects.
     */
    shipping: {
      weightKg: { type: Number, default: 0.3, min: 0 },
      lengthCm: { type: Number, default: 25, min: 0 },
      breadthCm: { type: Number, default: 20, min: 0 },
      heightCm: { type: Number, default: 4, min: 0 },
    },

    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    clearance: { type: Boolean, default: false },
    // Homepage picks — the handful shown on the home page for each collection.
    homeBestSeller: { type: Boolean, default: false },
    homeNewArrival: { type: Boolean, default: false },
    homeClearance: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Auto-generate a slug from the name when one isn't supplied.
productSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

/**
 * Everything on the shelf, whichever shape the product takes: colour variants
 * are summed, and within each the sizes are summed when the product is sized.
 */
productSchema.virtual("totalStock").get(function () {
  const sized = this.hasSizes !== false;
  const sum = (rows) => (rows || []).reduce((n, s) => n + (Number(s.stock) || 0), 0);

  if ((this.colors || []).length) {
    return this.colors.reduce(
      (n, c) => n + (sized ? sum(c.sizes) : Number(c.stock) || 0),
      0
    );
  }
  return sized ? sum(this.sizes) : Number(this.stock) || 0;
});

productSchema.index({ category: 1 });
productSchema.index({ name: "text", description: "text", category: "text" });

export default mongoose.model("Product", productSchema);
