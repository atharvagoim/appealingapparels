/**
 * Explicit, admin-curated product order for a homepage section (New
 * Arrivals / Best Sellers / Clearance Sale). The saved order is a list of
 * product IDs; anything no longer eligible is dropped, and anything newly
 * eligible (not yet in the saved order) is appended at the end so it isn't
 * silently lost — it just shows up last until someone drags it.
 */
export function mergeSectionOrder(products, savedIds) {
  const eligibleIds = new Set(products.map((p) => p.id));
  const saved = (savedIds || []).filter((id) => eligibleIds.has(id));
  const savedSet = new Set(saved);
  const extras = products.filter((p) => !savedSet.has(p.id)).map((p) => p.id);
  return [...saved, ...extras];
}

/** Same as mergeSectionOrder, but returns the actual product objects in order. */
export function orderedProducts(products, savedIds) {
  const orderIds = mergeSectionOrder(products, savedIds);
  const byId = new Map(products.map((p) => [p.id, p]));
  return orderIds.map((id) => byId.get(id)).filter(Boolean);
}
