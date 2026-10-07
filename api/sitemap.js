/**
 * Serves /sitemap.xml (via the rewrite in vercel.json) with every static page
 * plus a <url> entry for every live product, generated fresh on each request
 * from the same public product list the storefront uses — so a newly added
 * product shows up here without needing a rebuild or redeploy.
 *
 * The API now lives in this same deployment (api/index.js), so no env var is
 * needed for this to work out of the box — it calls its own /api/products.
 * Set API_URL (or VITE_API_URL) only if the API is ever split out again.
 */

const SITE_URL = (process.env.SITE_URL || "https://appealingapparels.vercel.app").replace(/\/$/, "");
const configuredApiUrl = (process.env.API_URL || process.env.VITE_API_URL || "").replace(/\/$/, "");

// Pages that exist regardless of the product catalogue.
const STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
];

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );

const urlEntry = (loc, lastmod) => `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ""}
  </url>`;

export default async function handler(req, res) {
  // Same deployment, same host — if no API_URL override is set, call our own
  // /api/products rather than needing a second service's URL configured.
  const apiUrl = configuredApiUrl || `https://${req.headers.host}/api`;

  let products = [];
  try {
    const r = await fetch(`${apiUrl}/products`);
    if (r.ok) products = await r.json();
  } catch {
    // A slow or down backend shouldn't take the sitemap offline — fall back
    // to just the static pages below rather than erroring out entirely.
  }

  const urls = [
    ...STATIC_PATHS.map((p) => urlEntry(`${SITE_URL}${p}`)),
    ...products
      .filter((p) => p?.slug)
      .map((p) => urlEntry(`${SITE_URL}/product/${p.slug}`, p.updatedAt)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // Regenerate at most once an hour — plenty fresh for a catalogue that
  // doesn't change minute to minute, without hitting the backend on every
  // single crawl request.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.status(200).send(xml);
}
