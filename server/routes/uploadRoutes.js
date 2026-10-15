import { Router } from "express";
import multer from "multer";
import ApiError from "../utils/ApiError.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { uploadProductImages } from "../controllers/uploadController.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Memory storage — files are streamed straight to ImageKit, never written to
// disk on this server. 8MB/file is generous for a product photo; 10 files
// covers one upload batch for a colourway.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    // Whitelist, not "image/*": SVG can carry scripts, so it's refused.
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, "Only JPG, PNG, WEBP, GIF or AVIF images are allowed."));
    }
    cb(null, true);
  },
});

router.post("/images", protect, requireAdmin, uploadLimiter, upload.array("images", 10), uploadProductImages);

export default router;
