/**
 * Looks up an Indian PIN code and returns its city (district) and state,
 * using India Post's free public pincode API. Returns null if the code
 * isn't a valid 6-digit PIN or nothing is found.
 */
export async function lookupPincode(pin) {
  const code = String(pin || "").trim();
  if (!/^\d{6}$/.test(code)) return null;

  const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
  if (!res.ok) throw new Error("Couldn't look up that PIN code.");

  const data = await res.json();
  const entry = data?.[0];
  if (entry?.Status !== "Success" || !entry.PostOffice?.length) return null;

  const po = entry.PostOffice[0];
  return { city: po.District || "", state: po.State || "" };
}
