import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import MongoRateLimitStore from "../utils/mongoRateLimitStore.js";

/**
 * Every limiter shares its counters through MongoDB (see MongoRateLimitStore),
 * so limits hold across serverless instances. If the store ever errors the
 * request is let through (passOnStoreError) — a database hiccup must not take
 * the shop offline.
 */
const make = (name, { windowMs, limit, message, key, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    passOnStoreError: true,
    store: new MongoRateLimitStore(name),
    keyGenerator: key || ((req) => ipKeyGenerator(req.ip)),
    message: { message },
  });

const MIN = 60 * 1000;

/** Per signed-in user when there is one, otherwise per IP. */
const byUser = (req) => (req.user?._id ? `u:${req.user._id}` : ipKeyGenerator(req.ip));

/** Lower-cased email/phone typed into a login or reset form. */
const byAccount = (req) =>
  `a:${String(req.body?.identifier ?? req.body?.email ?? "").trim().toLowerCase().slice(0, 120)}`;

/** Backstop across the whole API. */
export const generalLimiter = make("general", {
  windowMs: 15 * MIN,
  limit: 600,
  message: "Too many requests. Please slow down and try again shortly.",
});

/** Login / register / reset endpoints, per IP. */
export const authLimiter = make("auth", {
  windowMs: 15 * MIN,
  limit: 20,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

/**
 * Failed logins against ONE account, from anywhere. Stops a botnet that rotates
 * IPs from guessing a single password; only failures count, so real customers
 * who sign in correctly are never affected.
 */
export const loginAccountLimiter = make("login-account", {
  windowMs: 15 * MIN,
  limit: 8,
  key: byAccount,
  skipSuccessfulRequests: true,
  message: "Too many failed sign-in attempts for this account. Try again in 15 minutes.",
});

/** Reset-link emails: stops anyone using us to spam an inbox. */
export const forgotPasswordLimiter = make("forgot", {
  windowMs: 60 * MIN,
  limit: 5,
  key: byAccount,
  message: "Too many reset requests. Please try again in an hour.",
});

/** Wrong guesses of the Admin Access PIN (6 digits = guessable without this). */
export const adminPinLimiter = make("admin-pin", {
  windowMs: 15 * MIN,
  limit: 5,
  key: byUser,
  skipSuccessfulRequests: true,
  message: "Too many incorrect PIN attempts. Try again in 15 minutes.",
});

/** Creating payment orders (each one calls Razorpay and writes a pending order). */
export const checkoutLimiter = make("checkout", {
  windowMs: 15 * MIN,
  limit: 20,
  key: byUser,
  message: "Too many checkout attempts. Please wait a few minutes.",
});

/** Coupon guessing. */
export const couponLimiter = make("coupon", {
  windowMs: 15 * MIN,
  limit: 30,
  key: byUser,
  message: "Too many coupon attempts. Please wait a few minutes.",
});

/** Posting reviews / support messages. */
export const contentLimiter = make("content", {
  windowMs: 15 * MIN,
  limit: 30,
  key: byUser,
  message: "You're posting too quickly. Please wait a few minutes.",
});

/** Image uploads (each one costs ImageKit bandwidth). */
export const uploadLimiter = make("upload", {
  windowMs: 15 * MIN,
  limit: 60,
  key: byUser,
  message: "Too many uploads. Please wait a few minutes.",
});

/** Every admin write (create/update/delete) — a stolen admin token can't mass-edit instantly. */
export const adminWriteLimiter = make("admin-write", {
  windowMs: 15 * MIN,
  limit: 300,
  key: byUser,
  message: "Too many changes in a short time. Please wait a few minutes.",
});
