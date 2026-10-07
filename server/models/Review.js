import mongoose from "mongoose";

/**
 * A customer's star rating (and optional written note) for one product they
 * actually received. Reviews are always tied back to the delivered order they
 * came from, so nobody can review something they never bought.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    // Snapshots so the review still reads correctly if the account or the
    // catalogue entry changes later.
    name: { type: String, default: "Customer", trim: true },
    productName: { type: String, default: "", trim: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    body: { type: String, default: "", trim: true, maxlength: 1500 },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// One review per product per order — stops the same purchase being rated twice.
reviewSchema.index({ order: 1, product: 1 }, { unique: true });
reviewSchema.index({ createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
