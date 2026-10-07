import client from "./client";

/* public */
export async function fetchProductReviews(productId) {
  const { data } = await client.get(`/reviews/product/${productId}`);
  return data;
}
export async function fetchRatingSummary() {
  const { data } = await client.get("/reviews/summary");
  return data;
}

/* customer */
export async function fetchMyReviewableOrders() {
  const { data } = await client.get("/reviews/mine/orders");
  return data;
}
export async function fetchReviewPrompt() {
  const { data } = await client.get("/reviews/prompt");
  return data;
}
export async function markPromptSeenApi(orderId) {
  const { data } = await client.post(`/reviews/prompt/${orderId}/seen`);
  return data;
}
export async function submitReviewApi({ orderId, productId, rating, body }) {
  const { data } = await client.post("/reviews", {
    orderId,
    productId,
    rating,
    body,
  });
  return data;
}

/* admin */
export async function fetchAllReviews() {
  const { data } = await client.get("/reviews");
  return data;
}
export async function deleteReviewApi(id) {
  const { data } = await client.delete(`/reviews/${id}`);
  return data;
}
