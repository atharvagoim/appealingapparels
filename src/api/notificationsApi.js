import client from "./client";

/** Admin: what's happened (new orders, support messages, reviews) since a
 *  given timestamp. Pass the previous response's `now` back in as `since`
 *  on the next call to only get what's genuinely new. */
export async function fetchRecentEvents(since) {
  const { data } = await client.get("/admin/notifications", {
    params: since ? { since } : {},
  });
  return data;
}
