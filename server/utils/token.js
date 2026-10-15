import jwt from "jsonwebtoken";
import config from "../config/env.js";

export function signToken(user) {
  return jwt.sign(
    { id: user.id || user._id.toString(), role: user.role },
    config.jwtSecret,
    // Admin sessions are shorter: a stolen admin token is the worst case.
    { expiresIn: user.role === "admin" ? "1d" : config.jwtExpires }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
