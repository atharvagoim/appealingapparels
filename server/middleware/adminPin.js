import ApiError from "../utils/ApiError.js";

/**
 * A second confirmation layer in front of the "manage admin access" panel,
 * on top of already being signed in as an admin — so even another admin
 * can't add or remove team accounts without this PIN. Hardcoded per what
 * was asked for; change the value here if it ever needs to be different.
 */
export const ADMIN_ACCESS_PIN = "150725";

/** A distinct confirmation asked again for the single most sensitive action
 *  in this panel (moving the "can't be removed" lock to a different
 *  account) — deliberately not the same digits as the page-unlock PIN. */
export const ADMIN_LOCK_PIN = ADMIN_ACCESS_PIN.split("").reverse().join("");

export function requireAdminPin(req, res, next) {
  const supplied = req.header("x-admin-pin") || req.body?.pin || req.query?.pin;
  if (String(supplied || "") !== ADMIN_ACCESS_PIN) {
    return next(new ApiError(403, "Incorrect PIN."));
  }
  next();
}
