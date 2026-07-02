import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";
import User from "../models/User.js";
import { asyncHandler } from "./asyncHandler.js";

/** Require a valid Bearer token; attaches req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Not authenticated");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, "User no longer exists");

  req.user = user;
  next();
});

/** Require the authenticated user to be an admin. Use after `protect`. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
}
