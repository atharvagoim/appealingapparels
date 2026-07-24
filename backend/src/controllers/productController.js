import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { generateUniqueCode, normalizeAndCheckCode } from "../utils/productCode.js";

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
  if ("code" in body) {
    body.code = body.code && body.code.trim()
      ? await normalizeAndCheckCode(body.code, req.params.id)
      : await generateUniqueCode();
  }
  const product = await Product.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
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

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ id: req.params.id, deleted: true });
});
