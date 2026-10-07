import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import imagekit, { imagekitConfigured } from "../config/imagekit.js";

const FOLDERS = new Set(["products", "banners", "categories", "pages"]);

/**
 * Admin uploads product photos straight from their computer. Each file comes
 * in as a buffer (multer memory storage — nothing touches local disk), goes
 * up to ImageKit, and only the resulting URL is sent back. The product
 * document still stores plain URL strings, exactly as it did when URLs were
 * pasted in by hand — this just automates getting them there.
 */
export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!imagekitConfigured) {
    throw new ApiError(
      503,
      "Image uploads aren't configured on the server yet. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT."
    );
  }

  const files = req.files || [];
  if (files.length === 0) throw new ApiError(400, "No image files were sent.");

  // Which ImageKit folder the files land in — whitelisted so the client can't
  // write anywhere it likes.
  const folder = FOLDERS.has(req.query.folder) ? req.query.folder : "products";

  const uploads = await Promise.all(
    files.map((file) =>
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: `/${folder}`,
        useUniqueFileName: true,
      })
    )
  );

  res.json({ urls: uploads.map((u) => u.url) });
});
