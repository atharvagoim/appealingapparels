import mongoose from "mongoose";

/** One message in a customer <-> admin conversation. */
const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["user", "admin"], required: true },
    body: { type: String, required: true, trim: true },
    readByAdmin: { type: Boolean, default: false },
    readByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * One conversation between a customer and the store.
 *
 * A customer can have several of these running at once — typically one per
 * order or product they need help with, plus any general enquiries — so each
 * carries its own subject and context snapshot.
 */
const supportThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** What this conversation is about. */
    topic: {
      type: String,
      enum: ["order", "product", "general"],
      default: "general",
    },
    subject: { type: String, default: "General enquiry", trim: true },

    // Context, kept as both a reference and a snapshot so the thread still
    // reads correctly if the order or product changes later.
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderNumber: { type: String, default: "" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, default: "" },
    productImage: { type: String, default: "" },

    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

supportThreadSchema.index({ user: 1, lastMessageAt: -1 });

supportThreadSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Earlier versions allowed only one thread per customer and enforced it with a
 * unique index. That index would now reject every second conversation, so drop
 * it once on startup if it's still hanging around.
 */
supportThreadSchema.statics.dropLegacyUniqueIndex = async function () {
  try {
    const indexes = await this.collection.indexes();
    const legacy = indexes.find((i) => i.unique && i.key && i.key.user === 1);
    if (legacy) {
      await this.collection.dropIndex(legacy.name);
      console.log("✓ Dropped legacy unique index on support threads");
    }
  } catch {
    /* collection may not exist yet — nothing to do */
  }
};

export default mongoose.model("SupportThread", supportThreadSchema);
