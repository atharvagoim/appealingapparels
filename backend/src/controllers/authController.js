import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/** POST /api/auth/register — creates a customer account. */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required.");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, "An account with that email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  // Role is forced to "user" here — admins are provisioned via seed:admin,
  // never through the public registration endpoint.
  const user = await User.create({ name, email, passwordHash, role: "user" });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

/** POST /api/auth/login — works for both customers and admins. */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash"
  );
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

/** GET /api/auth/me — returns the current user (requires auth). */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
