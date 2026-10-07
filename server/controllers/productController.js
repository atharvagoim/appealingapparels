import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { generateUniqueCode, normalizeAndCheckCode } from "../utils/productCode.js";
import {
  applyProductDefaults,
  DEFAULT_DESCRIPTION,
  DEFAULT_HIGHLIGHTS,
  DEFAULT_FABRIC_CARE,
} from "../utils/productDefaults.js";
import { collectImageUrls, deleteUnusedImages } from "../utils/imagekitCleanup.js";

/**
 * GET /api/products
 * Optional query: ?search=&category=&featured=true&newArrival=true&clearance=true
 * Server-side parity with the Phase 1 storefront filters.
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, featured, newArrival, clearance } = req.query;
  const filter = {};

  if (category && category !== "All") filter.category = category;
  if (featured === "true") filter.featured = true;
  if (newArrival === "true") filter.newArrival = true;
  if (clearance === "true") filter.clearance = true;

  if (search) {
    const rx = new RegExp(search.trim(), "i");
    filter.$or = [{ name: rx }, { category: rx }, { description: rx }, { code: rx }];
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

/** GET /api/products/:slug */
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
});

/** POST /api/products */
export const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  // Fall back to the standard bag copy for anything the admin left blank.
  applyProductDefaults(body);
  // Admin can type their own code; otherwise one is generated.
  body.code = body.code && body.code.trim()
    ? await normalizeAndCheckCode(body.code)
    : await generateUniqueCode();
  const product = await Product.create(body);
  res.status(201).json(product);
});

/** PUT /api/products/:id */
export const updateProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  // Default only the fields the admin actually submitted but left blank — a
  // partial update must never overwrite copy they didn't touch.
  if ("description" in body && !String(body.description || "").trim()) {
    body.description = DEFAULT_DESCRIPTION;
  }
  if (
    "highlights" in body &&
    (!Array.isArray(body.highlights) || body.highlights.length === 0)
  ) {
    body.highlights = [...DEFAULT_HIGHLIGHTS];
  }
  if (
    "fabricCare" in body &&
    (!Array.isArray(body.fabricCare) || body.fabricCare.length === 0)
  ) {
    body.fabricCare = [...DEFAULT_FABRIC_CARE];
  }
  if ("code" in body) {
    body.code = body.code && body.code.trim()
      ? await normalizeAndCheckCode(body.code, req.params.id)
      : await generateUniqueCode();
  }
  const before = await Product.findById(req.params.id, "images colors.images");
  const product = await Product.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
  // Photos the admin removed in this edit — drop them from ImageKit too.
  const kept = new Set(collectImageUrls(product));
  await deleteUnusedImages(collectImageUrls(before).filter((u) => !kept.has(u)));
  res.json(product);
});

/**
 * POST /api/products/backfill-codes — admin-only one-off migration.
 * Assigns a unique code to every existing product that doesn't have one yet.
 */
export const backfillProductCodes = asyncHandler(async (req, res) => {
  const missing = await Product.find({
    $or: [{ code: { $exists: false } }, { code: null }, { code: "" }],
  });
  let updated = 0;
  for (const p of missing) {
    // eslint-disable-next-line no-await-in-loop
    p.code = await generateUniqueCode();
    // eslint-disable-next-line no-await-in-loop
    await p.save();
    updated += 1;
  }
  res.json({ updated, total: missing.length });
});

/**
 * POST /api/products/backfill-defaults — admin-only one-off migration.
 * Fills the standard bag description, highlights and fabric/care into every
 * existing product that's still missing them, so old products carry the same
 * defaults new ones get.
 */
export const backfillProductDefaults = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $or: [
      { description: { $in: [null, ""] } },
      { description: { $exists: false } },
      { highlights: { $size: 0 } },
      { highlights: { $exists: false } },
      { fabricCare: { $size: 0 } },
      { fabricCare: { $exists: false } },
    ],
  });

  let updated = 0;
  for (const p of products) {
    let changed = false;
    if (!String(p.description || "").trim()) {
      p.description = DEFAULT_DESCRIPTION;
      changed = true;
    }
    if (!Array.isArray(p.highlights) || p.highlights.length === 0) {
      p.highlights = [...DEFAULT_HIGHLIGHTS];
      changed = true;
    }
    if (!Array.isArray(p.fabricCare) || p.fabricCare.length === 0) {
      p.fabricCare = [...DEFAULT_FABRIC_CARE];
      changed = true;
    }
    if (changed) {
      // eslint-disable-next-line no-await-in-loop
      await p.save();
      updated += 1;
    }
  }
  res.json({ updated, total: products.length });
});

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  await deleteUnusedImages(collectImageUrls(product));
  res.json({ id: req.params.id, deleted: true });
});
