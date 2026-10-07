import mongoose from "mongoose";

/**
 * Server-side wishlist, one per user. Mirrors the localStorage wishlist added
 * in Phase 2; syncing happens after authentication lands in Phase 5.
 */
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
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

export default mongoose.model("Wishlist", wishlistSchema);
