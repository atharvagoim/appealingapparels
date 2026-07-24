import client from "./client";

/** GET /api/settings — public read (storefront + admin). */
export async function fetchSettings() {
  const { data } = await client.get("/settings");
  return data;
}

/** PUT /api/settings — admin write. Accepts { coverImages?, categories? }. */
export async function updateSettingsApi(payload) {
  const { data } = await client.put("/settings", payload);
  return data;
}
