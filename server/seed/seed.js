import mongoose from "mongoose";
import { assertConfig } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import Product from "../models/Product.js";
import { seedProducts } from "./products.seed.js";

async function run() {
  assertConfig();
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const data of seedProducts) {
    const existing = await Product.findOne({ slug: data.slug });
    if (existing) {
      await Product.updateOne({ slug: data.slug }, data);
      updated += 1;
    } else {
      await Product.create(data);
      created += 1;
    }
  }

  console.log(`✓ Seed complete — ${created} created, ${updated} updated.`);
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error("✖ Seed failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
