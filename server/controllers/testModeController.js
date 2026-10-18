import Settings from "../models/Settings.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Payment test mode — lets an ADMIN run a real checkout for ₹1–₹2 with no
 * shipping, to test the Razorpay flow end to end.
 *
 * Safety rules, all enforced here on the server:
 *  - Only changeable by a signed-in admin who also supplies the Admin Access
 *    PIN (see routes: protect → requireAdmin → adminPinLimiter → requireAdminPin).
 *  - It only ever affects checkouts made by ADMIN accounts. A real customer
 *    checking out while it is on pays the normal price.
 *  - It switches itself off after a set time (default 60 min, max 4 h), so it
 *    can't be left on by accident.
 *  - The amount is clamped to ₹1–₹2 on the server, whatever the client sends.
 */
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 2;
const DEFAULT_MINUTES = 60;
const MAX_MINUTES = 240;

const OFF = { enabled: false, amount: MIN_AMOUNT, expiresAt: null, enabledBy: "" };

/** Current state, with an expired window treated as off. */
export async function readTestMode() {
  const doc = await Settings.findOne({ key: "site" }).select("paymentTestMode").lean();
  const s = doc?.paymentTestMode || OFF;
  const expiresAt = s.expiresAt ? new Date(s.expiresAt) : null;
  const live = !!s.enabled && !!expiresAt && expiresAt.getTime() > Date.now();
  return {
    enabled: live,
    amount: Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, Math.round(Number(s.amount)) || MIN_AMOUNT)),
    expiresAt: live ? expiresAt.toISOString() : null,
    enabledBy: live ? s.enabledBy || "" : "",
  };
}

/** The test settings that apply to THIS user's checkout, or null. */
export async function testModeFor(user) {
  if (user?.role !== "admin") return null;
  const t = await readTestMode();
  return t.enabled ? t : null;
}

/** GET /api/admin/payment-test-mode  (admin + PIN) */
export const getTestMode = asyncHandler(async (_req, res) => {
  res.json(await readTestMode());
});

/** PUT /api/admin/payment-test-mode  (admin + PIN) — { enabled, amount, minutes } */
export const setTestMode = asyncHandler(async (req, res) => {
  const { enabled, amount, minutes } = req.body || {};
  if (typeof enabled !== "boolean") throw new ApiError(400, "Say whether test mode should be on or off.");

  let next = { ...OFF };
  if (enabled) {
    const amt = Math.round(Number(amount));
    if (![MIN_AMOUNT, MAX_AMOUNT].includes(amt)) {
      throw new ApiError(400, `The test amount must be ₹${MIN_AMOUNT} or ₹${MAX_AMOUNT}.`);
    }
    const mins = Math.min(MAX_MINUTES, Math.max(5, Math.round(Number(minutes)) || DEFAULT_MINUTES));
    next = {
      enabled: true,
      amount: amt,
      expiresAt: new Date(Date.now() + mins * 60 * 1000),
      enabledBy: `${req.user.name} <${req.user.email}>`,
    };
  }

  await Settings.findOneAndUpdate(
    { key: "site" },
    { $set: { paymentTestMode: next } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // Audit trail (Vercel/host logs).
  console.log(
    `[AUDIT] payment test mode ${enabled ? `ON (₹${next.amount}, until ${next.expiresAt.toISOString()})` : "OFF"} by ${req.user.email}`
  );

  res.json(await readTestMode());
});

/**
 * GET /api/orders/test-mode  (any signed-in user)
 * Tells the checkout page whether to show the test banner. Customers always
 * get `active: false`, so they can't even tell whether it is on.
 */
export const myTestMode = asyncHandler(async (req, res) => {
  const t = await testModeFor(req.user);
  res.json({ active: !!t, amount: t?.amount || 0, expiresAt: t?.expiresAt || null });
});
