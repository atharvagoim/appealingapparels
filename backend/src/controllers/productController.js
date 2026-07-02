import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * GET /api/products
 * Optional query: ?search=&category=&featured=true&newArrival=true
 * Server-side parity with the Phase 1 storefront filters.
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, featured, newArrival } = req.query;
  const filter = {};

  if (category && category !== "All") filter.category = category;
  if (featured === "true") filter.featured = true;
  if (newArrival === "true") filter.newArrival = true;

  if (search) {
    const rx = new RegExp(search.trim(), "i");
    filter.$or = [{ name: rx }, { category: rx }, { description: rx }];
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
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

/** PUT /api/products/:id */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
});

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ id: req.params.id, deleted: true });
});
