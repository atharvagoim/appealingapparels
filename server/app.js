import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import config from "./config/env.js";
import routes from "./routes/index.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

/**
 * Standard security headers (X-Content-Type-Options, X-Frame-Options, a
 * conservative Referrer-Policy, etc.). Two defaults are switched off because
 * they're built for a server that renders its own HTML/CSS pages — this is a
 * pure JSON + PDF API called from a *different* origin (the Vercel frontend):
 *   - contentSecurityPolicy: a CSP is meaningless for a JSON/PDF API and the
 *     default policy can make browsers refuse to load the responses.
 *   - crossOriginResourcePolicy: defaults to "same-origin", which would block
 *     the frontend from loading invoice PDFs and other responses across
 *     origins. CORS above already governs who can call this API.
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

/**
 * Origins the browser is allowed to call this API from.
 *
 * FRONTEND_URL may hold several, comma-separated. Vercel also mints a fresh
 * preview URL per deployment, so those are matched by pattern — otherwise the
 * API only works on whichever preview happened to be current when the variable
 * was last set.
 */
const allowedOrigins = String(config.frontendUrl || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Treat www.example.com and example.com as the same site, so listing one in
// FRONTEND_URL covers both.
for (const o of [...allowedOrigins]) {
  try {
    const u = new URL(o);
    const alt = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
    if (u.hostname !== "localhost" && !/^[\d.]+$/.test(u.hostname)) {
      allowedOrigins.push(`${u.protocol}//${alt}${u.port ? `:${u.port}` : ""}`);
    }
  } catch {
    /* "*" or malformed — leave as is */
  }
}

const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests, curl and server-to-server calls send no Origin.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*")) return callback(null, true);

      const clean = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(clean) || VERCEL_PREVIEW.test(clean)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);
// A body with no size cap lets a single request buffer an arbitrary amount
// of JSON into memory before any route even runs — 1mb covers every real
// payload this API receives (product forms, orders, support messages) with
// plenty of headroom, while still capping a deliberately huge request.
app.use(express.json({ limit: "1mb" }));

// Strips any request key that looks like a Mongo operator (starting with $
// or containing a dot) out of body/params/query, so a crafted payload like
// { "email": { "$ne": null } } can't be used to manipulate a query filter —
// defense in depth on top of the fact that every real filter in this app
// already coerces its inputs to strings first.
app.use(mongoSanitize());

// Ignores duplicate query-string keys (?status=paid&status=shipped) rather
// than letting the last one silently overwrite route logic that assumed a
// single value.
app.use(hpp());

app.use(generalLimiter);
if (config.nodeEnv === "development") app.use(morgan("dev"));

app.get("/", (req, res) =>
  res.json({ name: "Appealing Apparels API", docs: "/api/health" })
);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
