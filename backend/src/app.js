import express from "express";
import cors from "cors";
import morgan from "morgan";
import config from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

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
app.use(express.json());
if (config.nodeEnv === "development") app.use(morgan("dev"));

app.get("/", (req, res) =>
  res.json({ name: "Appealing Apparels API", docs: "/api/health" })
);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
