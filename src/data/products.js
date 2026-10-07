const img = (seed) =>
  `https://picsum.photos/seed/${seed}/900/1200?grayscale`;

export const products = [
  {
    id: "aa-001",

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
    id: "aa-002",

    slug: "essential-hoodie",

    name: "Essential Hoodie",

    category: "Hoodies",

    price: 1999,

    description:
      "Relaxed fit hoodie crafted from premium brushed fleece.",

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

export const newArrivals = products.filter(
  (product) => product.newArrival
);

export const bestSellers = products.filter(
  (product) => product.featured
);