import express from "express";
import cors from "cors";
import morgan from "morgan";
import config from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
if (config.nodeEnv === "development") app.use(morgan("dev"));

app.get("/", (req, res) =>
  res.json({ name: "Appealing Apparels API", docs: "/api/health" })
);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
