import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ADMIN_LOCK_PIN } from "../middleware/adminPin.js";

/** The one admin account that can't be removed right now — whichever email
 *  was last locked in, or the env-seeded ADMIN_EMAIL if none has been set. */
async function getLockedEmail() {
  const doc = await Settings.findOne({ key: "site" });
  return String(doc?.lockedAdminEmail || config.admin.email || "").toLowerCase();
}

const shape = (u, lockedEmail) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  createdAt: u.createdAt,
  isPrimary: u.email.toLowerCase() === lockedEmail,
});

/** GET /api/admin/team — everyone with admin access. */
export const listTeam = asyncHandler(async (_req, res) => {
  const [admins, lockedEmail] = await Promise.all([
    User.find({ role: "admin" }).sort("createdAt").lean(),
    getLockedEmail(),
  ]);
  res.json(admins.map((u) => shape(u, lockedEmail)));
});

/** POST /api/admin/team — add a new admin/employee account, or grant admin
 *  access to an existing customer account. Either way the password typed
 *  here becomes that account's password. */
export const addTeamMember = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required.");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.role === "admin") {
      throw new ApiError(409, "That account already has admin access.");
    }
    // A customer account with this email already exists — grant it admin
    // access rather than blocking. The password typed here is applied too,
    // so what the admin sets is what works at /admin (otherwise the person
    // would be stuck with whatever password they once chose as a customer).
    existing.role = "admin";
    if (name.trim()) existing.name = name.trim();
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
    return res.status(200).json(shape(existing, await getLockedEmail()));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "admin",
  });

  res.status(201).json(shape(user, await getLockedEmail()));
});

/**
 * DELETE /api/admin/team/:id — revoke an employee's admin access.
 *
 * This does NOT delete the account. If this person is also a genuine
 * customer — they've placed orders, saved addresses, left reviews,
 * messaged support — deleting the User document would orphan every one of
 * those records and lock them out of their own order history for no
 * reason. Revoking admin access just means switching their role back to
 * an ordinary customer account; everything else about them stays exactly
 * as it was.
 */
export const removeTeamMember = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "admin") {
    throw new ApiError(404, "Admin account not found.");
  }
  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, "You can't remove your own admin access — ask another admin to do it.");
  }
  const lockedEmail = await getLockedEmail();
  if (user.email.toLowerCase() === lockedEmail) {
    throw new ApiError(400, "The locked admin account can't be removed. Move the lock to another account first.");
  }

  user.role = "user";
  await user.save();
  res.json({ removed: true, id: req.params.id });
});

/**
 * POST /api/admin/team/primary — moves the "permanent, can't-be-removed"
 * lock from whichever account has it now to a different admin account.
 * Only one account is ever locked at a time, so locking a new one
 * automatically un-locks the old one — that's the whole point of this PIN-
 * gated action.
 */
export const setPrimaryAdmin = asyncHandler(async (req, res) => {
  const { email, confirmPin } = req.body;
  if (!email) throw new ApiError(400, "An email is required.");
  if (String(confirmPin || "") !== ADMIN_LOCK_PIN) {
    throw new ApiError(403, "Incorrect confirmation PIN.");
  }

  const target = await User.findOne({ email: String(email).toLowerCase(), role: "admin" });
  if (!target) throw new ApiError(404, "That admin account wasn't found.");

  await Settings.findOneAndUpdate(
    { key: "site" },
    { $set: { lockedAdminEmail: target.email.toLowerCase() } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ lockedEmail: target.email.toLowerCase() });
});
