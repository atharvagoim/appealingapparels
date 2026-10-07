import rateLimit from "express-rate-limit";

/**
 * Applied only to auth endpoints (login, register, forgot/reset password) —
 * the ones an attacker would actually script against to guess a password or
 * spam account creation. 20 attempts per 15 minutes per IP is generous enough
 * that a real person mistyping a password never gets blocked, but rules out
 * a scripted brute-force attempt.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait a few minutes and try again." },
});

/**
 * A light backstop across the whole API — high enough that normal browsing,
 * an admin dashboard polling stats, or a burst of add-to-cart clicks never
 * trips it, but it caps outright abuse or a runaway script.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again shortly." },
});
