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

/**
 * The cards a section shows, in the admin's order — where every colour card
 * is positioned on its own, so one colour of a product can sit apart from the
 * product's other colours.
 *
 * The saved order is a list of card keys (`<productId>:<colour>`, or just
 * `<productId>` for a product with no colour cards). Older saves held only
 * product ids; such an id stands for all of that product's cards, in their
 * natural order, so existing orders keep working until the next drag.
 * Anything not in the saved list is appended at the end.
 */
export function orderedEntries(products, colorsField, savedOrder) {
  const natural = sectionEntries(orderedProducts(products, savedOrder), colorsField);
  const byKey = new Map(natural.map((e) => [e.key, e]));
  const byProduct = new Map();
  natural.forEach((e) => {
    const list = byProduct.get(String(e.product.id)) || [];
    list.push(e);
    byProduct.set(String(e.product.id), list);
  });

  const out = [];
  const seen = new Set();
  const take = (e) => {
    if (!seen.has(e.key)) {
      seen.add(e.key);
      out.push(e);
    }
  };
  (savedOrder || []).forEach((token) => {
    if (byKey.has(token)) take(byKey.get(token));
    else (byProduct.get(String(token)) || []).forEach(take);
  });
  natural.forEach(take);
  return out;
}
