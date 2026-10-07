import Razorpay from "razorpay";
import crypto from "crypto";
import config, { paymentsConfigured } from "../config/env.js";

/**
 * Razorpay client, created only when keys are present. The KEY_SECRET stays
 * server-side; it's used to sign orders and to verify the payment signature.
 */
export const razorpay = paymentsConfigured
  ? new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    })
  : null;

export { paymentsConfigured };

/**
 * Verify a Razorpay payment signature.
 * HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET),
 * compared to razorpay_signature in constant time.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
