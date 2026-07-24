// Mirror of the frontend's starting catalogue. Seeding is idempotent
// (upsert by slug), so running it repeatedly is safe.
export const seedProducts = [
  {
    slug: "oversized-black-tee",
    name: "Oversized Black Tee",
    category: "T-Shirts",
    price: 999,
    description:
      "Premium heavyweight oversized t-shirt made from 240 GSM cotton.",
    featured: true,
    newArrival: true,
    images: [
      "/products/oversized-black-tee/front.avif",
      "/products/oversized-black-tee/back.avif",
      "/products/oversized-black-tee/detail.avif",
    ],
    sizes: [
      { size: "S", stock: 10 },
      { size: "M", stock: 15 },
      { size: "L", stock: 8 },
      { size: "XL", stock: 5 },
    ],
  },
  {
    slug: "essential-hoodie",
    name: "Essential Hoodie",
    category: "Hoodies",
    price: 1999,
    description: "Relaxed fit hoodie crafted from premium brushed fleece.",
    featured: true,
    newArrival: false,
    images: [
      "/products/essential-hoodie/front.avif",
      "/products/essential-hoodie/back.avif",
      "/products/essential-hoodie/detail.avif",
    ],
    sizes: [
      { size: "S", stock: 6 },
      { size: "M", stock: 10 },
      { size: "L", stock: 7 },
      { size: "XL", stock: 4 },
    ],
  },
];
