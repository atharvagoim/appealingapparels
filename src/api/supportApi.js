import client from "./client";

/* customer */
export async function fetchMyThreads() {
  const { data } = await client.get("/support/me/threads");
  return data;
}
export async function fetchMyThread(id) {
  const { data } = await client.get(`/support/me/threads/${id}`);
  return data;
}
/**
 * Start a conversation. `context` may carry an order or a product so the store
 * knows what the question is about.
 */
export async function startMyThread({ body, ...context }) {
  const { data } = await client.post("/support/me/threads", { body, ...context });
  return data;
}
export async function sendMyMessage(threadId, body) {
  const { data } = await client.post(`/support/me/threads/${threadId}/messages`, {
    body,
  });
  return data;
}

/* admin */
export async function fetchThreads() {
  const { data } = await client.get("/support");
  return data;
}
export async function fetchThread(id) {
  const { data } = await client.get(`/support/${id}`);
  return data;
}
export async function replyToThread(id, body) {
  const { data } = await client.post(`/support/${id}/messages`, { body });
  return data;
}
export async function deleteThreadApi(id) {
  const { data } = await client.delete(`/support/${id}`);
  return data;
}
export async function setThreadStatusApi(id, status) {
  const { data } = await client.put(`/support/${id}/status`, { status });
  return data;
}
