import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true, uppercase: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, trim: true, default: "Uncategorised" },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "", trim: true },
    images: { type: [String], default: [] },
    sizes: { type: [sizeSchema], default: [] },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
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

// Total stock across all sizes — handy for inventory views.
productSchema.virtual("totalStock").get(function () {
  return (this.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
});

productSchema.index({ category: 1 });
productSchema.index({ name: "text", description: "text", category: "text" });

export default mongoose.model("Product", productSchema);
