import client from "./client";

export async function fetchProducts(params = {}) {
  const { data } = await client.get("/products", { params });
  return data;
}

export async function fetchProductBySlug(slug) {
  const { data } = await client.get(`/products/${slug}`);
  return data;
}

export async function createProductApi(payload) {
  const { data } = await client.post("/products", payload);
  return data;
}

export async function updateProductApi(id, payload) {
  const { data } = await client.put(`/products/${id}`, payload);
  return data;
}

export async function deleteProductApi(id) {
  const { data } = await client.delete(`/products/${id}`);
  return data;
}

/** Admin: assign a unique code to every existing product that doesn't have one. */
export async function backfillProductCodesApi() {
  const { data } = await client.post("/products/backfill-codes");
  return data;
}
