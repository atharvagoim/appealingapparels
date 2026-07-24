import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import config from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
});

/** POST /api/auth/register — creates a customer account. */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required.");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, "An account with that email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  // Role is forced to "user" here — admins are provisioned via seed:admin,
  // never through the public registration endpoint.
  const user = await User.create({ name, email, passwordHash, role: "user" });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

/** POST /api/auth/login — works for both customers and admins. */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash"
  );
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

/** GET /api/auth/me — returns the current user (requires auth). */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

/**
 * POST /api/auth/reset-password — customer password reset.
 * Body: { email, newPassword }. Admin accounts cannot be reset here.
 */
/**
 * POST /api/auth/forgot-password  { email }
 * Emails a one-time reset link. Always responds the same way, so this can't be
 * used to discover which email addresses have accounts.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required.");

  const generic = {
    message:
      "If an account exists for that email, we've sent a password reset link. Please check your inbox (and spam).",
  };

  const user = await User.findOne({ email: email.toLowerCase() });

  // Never reset an admin by email, and never reveal whether the account exists.
  if (!user || user.role === "admin") {
    return res.json(generic);
  }

  // Raw token goes in the email; only its hash is stored.
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes
  await user.save();

  const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (err) {
    // Don't leave a live token behind if the email never went out.
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    console.error("Password reset email failed:", err?.message || err);
    throw new ApiError(500, "Could not send the reset email. Please try again later.");
  }

  res.json(generic);
});

/**
 * POST /api/auth/reset-password  { token, newPassword }
 * Only a valid, unexpired, unused token can change a password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new ApiError(400, "A reset link and a new password are required.");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpires: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpires +passwordHash");

  if (!user || user.role === "admin") {
    throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  // Burn the token so the link can't be reused.
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: "Password updated. You can now sign in." });
});

/** PUT /api/auth/me — update the signed-in customer's own details. */
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found.");

  if (typeof name === "string") {
    if (!name.trim()) throw new ApiError(400, "Name can't be empty.");
    user.name = name.trim();
  }
  if (typeof phone === "string") user.phone = phone.trim();

  await user.save();
  res.json({ user: publicUser(user) });
});
