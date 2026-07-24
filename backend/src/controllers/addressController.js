import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const REQUIRED = ["fullName", "phone", "line1", "city", "state", "postalCode"];

const validate = (body) => {
  const missing = REQUIRED.filter((k) => !String(body[k] || "").trim());
  if (missing.length) {
    throw new ApiError(400, "Please fill in every address field.");
  }
};

const pick = (b) => ({
  label: (b.label || "Home").trim(),
  fullName: b.fullName.trim(),
  phone: b.phone.trim(),
  line1: b.line1.trim(),
  city: b.city.trim(),
  state: b.state.trim(),
  postalCode: b.postalCode.trim(),
});

/** GET /api/addresses — the signed-in user's saved addresses. */
export const listAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user?.addresses || []);
});

/** POST /api/addresses — save a new address. */
export const addAddress = asyncHandler(async (req, res) => {
  validate(req.body);
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found.");

  const address = pick(req.body);
  // First address becomes the default automatically.
  address.isDefault = user.addresses.length === 0 || Boolean(req.body.isDefault);
  if (address.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push(address);
  if (!user.phone) user.phone = address.phone;
  await user.save();

  res.status(201).json(user.addresses);
});

/** PUT /api/addresses/:id — update one of the user's addresses. */
export const updateAddress = asyncHandler(async (req, res) => {
  validate(req.body);
  const user = await User.findById(req.user._id);
  const address = user?.addresses.id(req.params.id);
  if (!address) throw new ApiError(404, "Address not found.");

  Object.assign(address, pick(req.body));
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }
  await user.save();

  res.json(user.addresses);
});

/** PUT /api/addresses/:id/default — mark one address as the default. */
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user?.addresses.id(req.params.id);
  if (!address) throw new ApiError(404, "Address not found.");

  user.addresses.forEach((a) => (a.isDefault = false));
  address.isDefault = true;
  await user.save();

  res.json(user.addresses);
});

/** DELETE /api/addresses/:id */
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user?.addresses.id(req.params.id);
  if (!address) throw new ApiError(404, "Address not found.");

  const wasDefault = address.isDefault;
  address.deleteOne();
  // Keep exactly one default when possible.
  if (wasDefault && user.addresses.length) {
    user.addresses[0].isDefault = true;
  }
  await user.save();

  res.json(user.addresses);
});
