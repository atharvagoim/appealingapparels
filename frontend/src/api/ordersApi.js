import client from "./client";

export async function createOrderApi(payload) {
  const { data } = await client.post("/orders/create-order", payload);
  return data;
}

export async function verifyPaymentApi(payload) {
  const { data } = await client.post("/orders/verify-payment", payload);
  return data;
}

export async function fetchMyOrders() {
  const { data } = await client.get("/orders/mine");
  return data;
}

export async function fetchAllOrders() {
  const { data } = await client.get("/orders");
  return data;
}

/**
 * Admin: move an order to a new status. Shipping also carries the dispatch
 * details, which the server insists on before it will mark anything shipped.
 */
export async function updateOrderStatusApi(id, status, extra = {}) {
  const { data } = await client.put(`/orders/${id}/status`, { status, ...extra });
  return data;
}

/** Admin: correct the courier / tracking details after dispatch. */
export async function updateShipmentApi(id, shipment) {
  const { data } = await client.put(`/orders/${id}/shipment`, shipment);
  return data;
}

/** Admin: attach a note to an order without changing its status. */
export async function addOrderNoteApi(id, note) {
  const { data } = await client.post(`/orders/${id}/notes`, { note });
  return data;
}

/** Download a paid order's PDF invoice (auth header comes from the client). */
export async function downloadInvoice(orderId, orderNumber) {
  const { data } = await client.get(`/orders/${orderId}/invoice`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${orderNumber || orderId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Open a paid order's invoice in a new tab (admin/customer preview). */
export async function viewInvoice(orderId) {
  const { data } = await client.get(`/orders/${orderId}/invoice`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  window.open(url, "_blank", "noopener");
  // Give the tab a moment to load before releasing the object URL.
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}

/** Delete a single pending (unpaid) order. */
export async function deleteOrderApi(id) {
  const { data } = await client.delete(`/orders/${id}`);
  return data;
}

/** Delete ALL pending (unpaid) orders. */
export async function clearPendingOrdersApi() {
  const { data } = await client.delete("/orders/pending");
  return data;
}
