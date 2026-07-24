import client from "./client";

export async function fetchCustomers() {
  const { data } = await client.get("/admin/customers");
  return data;
}
export async function fetchCustomer(id) {
  const { data } = await client.get(`/admin/customers/${id}`);
  return data;
}
