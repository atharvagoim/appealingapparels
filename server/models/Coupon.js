import mongoose from "mongoose";

/**
 * Records who redeemed a coupon and on which order, so per-user and global
 * usage limits can be enforced without a separate collection.
 */
const redemptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    amount: { type: Number, default: 0 },
    redeemedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["percentage", "flat", "freeShipping"],
      required: true,
    },
    // Percent (1-100) for "percentage"; ₹ amount for "flat"; unused for "freeShipping".
    value: { type: Number, default: 0, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    // Cap on the discount amount — only meaningful for "percentage".
    maxDiscount: { type: Number, default: null, min: 0 },
    startAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    // Total number of times this coupon can ever be redeemed, across all customers.
    usageLimit: { type: Number, default: null, min: 1 },
    // How many times a single customer can redeem it.
    perUserLimit: { type: Number, default: 1, min: 1 },
    active: { type: Boolean, default: true },
    // Whether this coupon advertises itself as a banner on product pages.
    showOnProductPage: { type: Boolean, default: true },
    redemptions: { type: [redemptionSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.usedCount = ret.redemptions?.length || 0;
        return ret;
      },
    },
  }
);

export default mongoose.model("Coupon", couponSchema);
