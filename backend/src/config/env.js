import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || "*",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  admin: {
    name: process.env.ADMIN_NAME || "Store Admin",
    email: process.env.ADMIN_EMAIL || "admin@appealingapparels.com",
    password: process.env.ADMIN_PASSWORD || "changeme123",
  },
};

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
