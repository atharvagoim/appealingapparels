import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User collection. Auth fields are defined now as part of the Phase 4
 * foundation; the JWT login/registration logic that uses them arrives in
 * Phase 5. `passwordHash` (never the raw password) is stored on the document.
 */
/** A saved delivery address belonging to a user. */
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: { type: String, trim: true, default: "" },
    addresses: { type: [addressSchema], default: [] },
    // Password reset: we store only a HASH of the emailed token, plus an expiry.
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

/** Compare a plaintext password against the stored hash. */
userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", userSchema);
