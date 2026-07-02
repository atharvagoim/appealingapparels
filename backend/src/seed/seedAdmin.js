import bcrypt from "bcryptjs";
import { assertConfig } from "../config/env.js";
import config from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";

async function run() {
  assertConfig();
  await connectDB();

  const { name, email, password } = config.admin;
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    await existing.save();
    console.log(`✓ Admin updated: ${email}`);
  } else {
    await User.create({ name, email, passwordHash, role: "admin" });
    console.log(`✓ Admin created: ${email}`);
  }

  if (password === "changeme123") {
    console.warn("⚠ Using the default admin password — change ADMIN_PASSWORD in .env.");
  }

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error("✖ Admin seed failed:", err);
  process.exit(1);
});
