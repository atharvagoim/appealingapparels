import mongoose from "mongoose";
import app from "../server/app.js";
import config from "../server/config/env.js";

/**
 * Vercel serverless entry point for the whole API (everything previously
 * hosted as its own backend service). `server/app.js` is the exact same
 * Express app that used to run on Render — nothing about its routes,
 * middleware, or behaviour changed. This file only adapts it to run as a
 * function instead of a long-lived process:
 *
 *  - It never calls app.listen() (that's for local/traditional hosting —
 *    see server/server.js, which still works unchanged for local dev).
 *  - It connects to MongoDB lazily and caches the connection on `global`,
 *    so a warm function instance reuses it instead of reconnecting (or
 *    opening a new pool) on every single request.
 *  - A connection failure returns a normal 500 response for that one
 *    request instead of calling process.exit() (which would be wrong in a
 *    shared serverless container — server/server.js's own bootstrap still
 *    exits on failure for the traditional-hosting path, untouched).
 */

mongoose.set("strictQuery", true);

async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) return; // already connected

  if (!global.__mongoosePromise) {
    global.__mongoosePromise = mongoose
      .connect(config.mongoUri)
      .catch((err) => {
        global.__mongoosePromise = null; // let the next request retry
        throw err;
      });
  }
  await global.__mongoosePromise;
}

export default async function handler(req, res) {
  try {
    await ensureDbConnected();
  } catch (err) {
    console.error("✖ MongoDB connection error:", err.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Database connection failed." }));
    return;
  }
  app(req, res);
}
