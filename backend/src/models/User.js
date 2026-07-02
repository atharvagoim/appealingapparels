import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User collection. Auth fields are defined now as part of the Phase 4
 * foundation; the JWT login/registration logic that uses them arrives in
 * Phase 5. `passwordHash` (never the raw password) is stored on the document.
 */
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
