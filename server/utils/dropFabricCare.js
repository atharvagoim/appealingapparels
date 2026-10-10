import Product from "../models/Product.js";

/**
 * "Fabric & care" was removed from products for good. This strips the leftover
 * field from any product document that still carries it. Uses the raw
 * collection because the schema no longer knows the field, and is safe to run
 * any number of times. Never throws — it's housekeeping, not a startup blocker.
 */
export async function dropFabricCare() {
  try {
    const res = await Product.collection.updateMany(
      { fabricCare: { $exists: true } },
      { $unset: { fabricCare: "" } }
    );
    if (res.modifiedCount) console.log(`✓ Removed fabricCare from ${res.modifiedCount} product(s)`);
  } catch (err) {
    console.warn(`fabricCare cleanup skipped: ${err.message}`);
  }
}
