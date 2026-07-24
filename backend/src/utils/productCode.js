import Product from "../models/Product.js";
import ApiError from "./ApiError.js";

// Excludes visually-ambiguous characters (0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `AA-${s}`;
}

/** Generates a product code guaranteed not to collide with an existing one. */
export async function generateUniqueCode() {
  for (let i = 0; i < 25; i++) {
    const candidate = randomCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Product.exists({ code: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, "Couldn't generate a unique product code — please try again.");
}

/**
 * Normalizes an admin-typed code and confirms it isn't already taken.
 * Pass `excludeId` when editing a product so it doesn't collide with itself.
 */
export async function normalizeAndCheckCode(raw, excludeId) {
  const code = String(raw || "").trim().toUpperCase();
  if (!code) return null;
  const query = { code };
  if (excludeId) query._id = { $ne: excludeId };
  const exists = await Product.exists(query);
  if (exists) {
    throw new ApiError(400, `Product code "${code}" is already in use.`);
  }
  return code;
}
