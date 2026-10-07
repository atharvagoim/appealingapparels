import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  /**
   * Allowed browser origins, comma-separated. Every Vercel deployment gets its
   * own preview URL, so a single hardcoded value breaks the moment you visit
   * the production domain instead of the preview that was current when it was
   * set. Preview subdomains are matched by pattern below rather than listed.
   */
  frontendUrl: process.env.FRONTEND_URL || "*",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  admin: {
    name: process.env.ADMIN_NAME || "Store Admin",
    email: process.env.ADMIN_EMAIL || "admin@appealingapparels.com",
    password: process.env.ADMIN_PASSWORD || "changeme123",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  },
  mail: {
    // Brevo's HTTP API is preferred: many hosts (Render's lower tiers included)
    // block outbound SMTP ports, which makes port 587 fail silently in
    // production while working fine locally.
    brevoKey: process.env.BREVO_API_KEY || "",
    // SMTP fallback — works with Brevo or any other provider.
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "appealingapparels543@gmail.com",
    fromName: process.env.MAIL_FROM_NAME || "Appealing Apparels",
  },
};

export const paymentsConfigured = Boolean(
  config.razorpay.keyId && config.razorpay.keySecret
);

export const isProd = config.nodeEnv === "production";

/** Fail fast if a required variable is missing. */
export function assertConfig() {
  if (!config.mongoUri) {
    console.error(
      "✖ MONGODB_URI is not set. Copy .env.example to .env and add your Atlas connection string."
    );
    process.exit(1);
  }
  if (!config.jwtSecret) {
    console.error(
      "✖ JWT_SECRET is not set. Add a long random string to .env (used to sign auth tokens)."
    );
    process.exit(1);
  }
}

export default config;
