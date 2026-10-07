import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import imagekit, { imagekitConfigured } from "../config/imagekit.js";

/** Every image URL a product points at (product-level + each colourway). */
export function collectImageUrls(product) {
  if (!product) return [];
  const doc = typeof product.toObject === "function" ? product.toObject() : product;
  const urls = [...(doc.images || [])];
  (doc.colors || []).forEach((c) => urls.push(...(c.images || [])));
  return urls.filter((u) => typeof u === "string" && u);
}

const bare = (url) => url.split("?")[0];

/** Every image URL the site settings point at (covers, categories, banners…). */
export function collectSettingsImageUrls(settings) {
  if (!settings) return [];
  const doc = typeof settings.toObject === "function" ? settings.toObject() : settings;
  const urls = [
    ...(doc.coverImages || []).map((c) => (typeof c === "string" ? c : c?.image)),
    ...(doc.storeImages || []).map((s) => (typeof s === "string" ? s : s?.src)),
    ...(doc.categories || []).map((c) => c?.image),
    ...Object.values(doc.sectionHeaders || {}).map((h) => h?.bannerImage),
    doc.aboutImage,
    doc.authLoginImage,
    doc.authSignupImage,
    doc.authPopupImage,
  ];
  return urls.filter((u) => typeof u === "string" && u);
}

/**
 * Best-effort: delete the given ImageKit-hosted URLs from the media library,
 * skipping any still referenced by a product (an image can be shared across
 * products or colourways). Never throws — a failed cleanup must not fail the
 * save/delete the admin actually asked for; it just leaves an orphan file.
 */
export async function deleteUnusedImages(urls) {
  if (!imagekitConfigured || !urls?.length) return;
  const endpoint = String(process.env.IMAGEKIT_URL_ENDPOINT || "").replace(/\/$/, "");

  const candidates = [...new Set(urls.map(bare))].filter((u) => u.startsWith(`${endpoint}/`));
  if (!candidates.length) return;

  try {
    // Still in use anywhere? Keep it.
    const stillUsed = new Set(
      [
        ...(await Product.find({}, "images colors.images").lean()).flatMap(collectImageUrls),
        ...collectSettingsImageUrls(await Settings.findOne({ key: "site" }).lean()),
      ].map(bare)
    );

    for (const url of candidates) {
      if (stillUsed.has(url)) continue;
      try {
        const filePath = decodeURIComponent(url.slice(endpoint.length));
        const name = filePath.split("/").pop();
        const folder = filePath.slice(0, filePath.lastIndexOf("/")) || "/";
        const files = await imagekit.listFiles({
          path: folder,
          searchQuery: `name = "${name.replace(/"/g, '\\"')}"`,
          limit: 1,
        });
        const file = files.find((f) => f.filePath === filePath) || files[0];
        if (file?.fileId) {
          await imagekit.deleteFile(file.fileId);
          console.log(`ImageKit: deleted ${filePath}`);
        } else {
          console.warn(`ImageKit cleanup: no file found for ${filePath}`);
        }
      } catch (err) {
        console.warn(`ImageKit cleanup failed for ${url}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`ImageKit cleanup skipped: ${err.message}`);
  }
}
