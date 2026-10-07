import client from "./client";

export async function fetchAddresses() {
  const { data } = await client.get("/addresses");
  return data;
}

export async function addAddressApi(address) {
  const { data } = await client.post("/addresses", address);
  return data; // full list back
}

export async function updateAddressApi(id, address) {
  const { data } = await client.put(`/addresses/${id}`, address);
  return data;
}

export async function setDefaultAddressApi(id) {
  const { data } = await client.put(`/addresses/${id}/default`);
  return data;
}

export async function deleteAddressApi(id) {
  const { data } = await client.delete(`/addresses/${id}`);
  return data;
}
