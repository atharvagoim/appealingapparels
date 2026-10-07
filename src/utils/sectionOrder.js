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

/**
 * Expand an ordered product list into the cards a homepage rail should show.
 *
 * `colorsField` names the per-section list of chosen colourways
 * (featuredColors / newArrivalColors / clearanceColors). The rules:
 *  - no colourways            → one card for the product.
 *  - specific colours chosen  → one card per chosen colour.
 *  - flagged but none chosen  → the primary colour's card (legacy behaviour),
 *                               so products picked before this feature still
 *                               render exactly as they used to.
 */
export function sectionEntries(products, colorsField) {
  const entries = [];
  (products || []).forEach((p) => {
    const colors = p.colors || [];
    if (colors.length === 0) {
      entries.push({ key: p.id, product: p, colorName: null });
      return;
    }
    const names = p[colorsField] || [];
    const picked = colors.filter((c) => names.includes(c.name));
    if (picked.length > 0) {
      picked.forEach((c) =>
        entries.push({ key: `${p.id}:${c.name}`, product: p, colorName: c.name })
      );
    } else {
      const primary = colors.find((c) => c.primary) || colors[0];
      entries.push({ key: p.id, product: p, colorName: primary?.name || null });
    }
  });
  return entries;
}
