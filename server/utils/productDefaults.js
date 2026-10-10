/**
 * Default long-form copy applied to a product when the admin leaves these
 * fields blank while adding or editing. Kept in one place so the storefront
 * fallback and the persisted defaults never drift apart.
 */
export const DEFAULT_DESCRIPTION =
  "A stylish and functional bag designed for everyday use. Spacious, durable, and perfect for carrying your daily essentials with ease.";

export const DEFAULT_HIGHLIGHTS = [
  "Spacious main compartment",
  "Premium quality material",
  "Lightweight & durable",
  "Secure zipper closure",
  "Comfortable to carry",
  "Ideal for daily use",
];

/**
 * Fill in the defaults on a product-shaped body, but only where the admin
 * hasn't supplied their own. Mutates and returns the same object.
 */
export function applyProductDefaults(body) {
  if (!body || typeof body !== "object") return body;

  if (!String(body.description || "").trim()) {
    body.description = DEFAULT_DESCRIPTION;
  }
  if (!Array.isArray(body.highlights) || body.highlights.length === 0) {
    body.highlights = [...DEFAULT_HIGHLIGHTS];
  }
  // "Fabric & care" no longer exists — drop it if an old client still sends it.
  delete body.fabricCare;
  return body;
}
