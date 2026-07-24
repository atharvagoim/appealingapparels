import mongoose from "mongoose";

/**
 * Order collection. Foundation for Phase 6 (Razorpay). The payment sub-document
 * holds gateway references so checkout can attach them once integrated.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    code: String,
    image: String,
    size: String,
    color: String,
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

/** One status change, recorded so the order's history is never a guess. */
const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      required: true,
    },
    at: { type: Date, default: Date.now },
    byName: { type: String, default: "System" },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false }
);

/**
 * Broader audit trail — status changes plus anything else worth answering a
 * "who did that, and when?" question with.
 */
const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    detail: { type: String, default: "" },
    at: { type: Date, default: Date.now },
    byName: { type: String, default: "System" },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Human-facing reference, assigned once the payment succeeds.
    orderNumber: { type: String, unique: true, sparse: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    amounts: {
      subtotal: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    coupon: {
      code: String,
      type: { type: String, enum: ["percentage", "flat", "freeShipping"] },
      value: Number,
      discountAmount: { type: Number, default: 0 },
    },
    shippingAddress: {
      fullName: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "India" },
      phone: String,
      email: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    payment: {
      provider: { type: String, default: "razorpay" },
      status: {
        type: String,
        enum: ["created", "authorized", "captured", "failed", "refunded"],
        default: "created",
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    /** Dispatch details, captured when the order is marked shipped. */
    shipment: {
      courier: { type: String, default: "", trim: true },
      trackingNumber: { type: String, default: "", trim: true, index: true },
      dispatchDate: { type: Date, default: null },
      trackingUrl: { type: String, default: "", trim: true },
    },

    timeline: { type: [timelineSchema], default: [] },
    activity: { type: [activitySchema], default: [] },

    // Set the moment the "how was it?" popup is served on the homepage, so a
    // customer is never asked about the same order twice.
    reviewPromptedAt: { type: Date, default: null },
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

export default mongoose.model("Order", orderSchema);
