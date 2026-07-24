import client from "./client";

export async function loginApi(email, password) {
  const { data } = await client.post("/auth/login", { email, password });
  return data; // { token, user }
}

export async function registerApi(name, email, password) {
  const { data } = await client.post("/auth/register", { name, email, password });
  return data; // { token, user }
}

export async function getMeApi() {
  const { data } = await client.get("/auth/me");
  return data.user;
}

/** Ask for a reset link to be emailed. Response is always generic. */
export async function forgotPasswordApi(email) {
  const { data } = await client.post("/auth/forgot-password", { email });
  return data; // { message }
}

/** Complete the reset using the one-time token from the emailed link. */
export async function resetPasswordApi(token, newPassword) {
  const { data } = await client.post("/auth/reset-password", { token, newPassword });
  return data; // { message }
}

/** Update the signed-in customer's own details. */
export async function updateMeApi(payload) {
  const { data } = await client.put("/auth/me", payload);
  return data.user;
}
