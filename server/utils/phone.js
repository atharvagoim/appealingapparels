/**
 * Normalizes a phone number to just digits plus an optional leading "+", so
 * "+91 98188-39792", "919818839792" and "98188 39792" all compare equal.
 * Returns "" for anything too short to plausibly be a real phone number.
 */
export function normalizePhone(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return `${plus}${digits}`;
}
