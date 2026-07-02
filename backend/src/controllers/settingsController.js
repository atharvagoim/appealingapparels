import Settings from "../models/Settings.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const DEFAULT_COVERS = [
  "https://picsum.photos/seed/aa-cover-1/1600/2000?grayscale",
  "https://picsum.photos/seed/aa-cover-2/1600/2000?grayscale",
  "https://picsum.photos/seed/aa-cover-3/1600/2000?grayscale",
];

const DEFAULT_CATEGORIES = [
  { label: "T-Shirts", image: "https://picsum.photos/seed/aa-cat-tshirt/1400/900?grayscale", link: "/shop?category=T-Shirts" },
  { label: "Hoodies", image: "https://picsum.photos/seed/aa-cat-hoodie/1400/900?grayscale", link: "/shop?category=Hoodies" },
  { label: "Bottoms", image: "https://picsum.photos/seed/aa-cat-bottoms/1400/900?grayscale", link: "/shop?category=Bottoms" },
];

async function getOrCreate() {
  let doc = await Settings.findOne({ key: "site" });
  if (!doc) {
    doc = await Settings.create({
      key: "site",
      coverImages: DEFAULT_COVERS,
      categories: DEFAULT_CATEGORIES,
    });
  }
  return doc;
}

/** GET /api/settings — public (storefront reads this). */
export const getSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  res.json(doc);
});

/** PUT /api/settings — admin only. Accepts { coverImages?, categories? }. */
export const updateSettings = asyncHandler(async (req, res) => {
  const { coverImages, categories } = req.body;
  const update = {};
  if (Array.isArray(coverImages)) update.coverImages = coverImages;
  if (Array.isArray(categories)) update.categories = categories;

  const doc = await Settings.findOneAndUpdate(
    { key: "site" },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc);
});
