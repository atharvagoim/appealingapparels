import config from "../config/env.js";

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose validation
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  // Invalid ObjectId etc.
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists.`;
  }
  // multer (file upload) — too big, too many, or a rejected fileFilter
  if (err.name === "MulterError") {
    status = 400;
    if (err.code === "LIMIT_FILE_SIZE") message = "Each image must be under 8MB.";
    else if (err.code === "LIMIT_FILE_COUNT") message = "You can upload up to 10 images at once.";
    else message = err.message || "Upload failed.";
  }

  res.status(status).json({
    // `error` kept for any existing consumers; `message` is what the frontend
    // reads, so the real reason surfaces instead of a generic fallback.
    error: message,
    message,
    ...(config.nodeEnv === "development" ? { stack: err.stack } : {}),
  });
}
