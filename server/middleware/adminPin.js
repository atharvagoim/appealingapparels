import crypto from "crypto";
import ApiError from "../utils/ApiError.js";

/**
 * A second confirmation layer in front of the "manage admin access" panel,
 * on top of already being signed in as an admin — so even another admin
 * can't add or remove team accounts without this PIN.
 *
 * The PIN lives only in the ADMIN_ACCESS_PIN environment variable (Vercel →
 * Settings → Environment Variables); it is never stored in the code. If the
 * variable isn't set, this panel stays locked for everyone rather than
 * falling back to a default.
 */
export const getAccessPin = () => String(process.env.ADMIN_ACCESS_PIN || "").trim();

/** A distinct confirmation asked again for the single most sensitive action
 *  in this panel (moving the "can't be removed" lock to a different
 *  account) — the access PIN reversed, so there's still just one value to keep. */
export const getLockPin = () => getAccessPin().split("").reverse().join("");

/** Constant-time string compare. */
export function pinMatches(supplied, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(supplied || ""));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function requireAdminPin(req, res, next) {
  if (!getAccessPin()) {
    return next(
      new ApiError(503, "Admin Access isn't set up yet — add ADMIN_ACCESS_PIN to the server's environment variables.")
    );
  }
  const supplied = req.header("x-admin-pin") || req.body?.pin || req.query?.pin;
  if (!pinMatches(supplied, getAccessPin())) {
    return next(new ApiError(403, "Incorrect PIN."));
  }
  next();
}
