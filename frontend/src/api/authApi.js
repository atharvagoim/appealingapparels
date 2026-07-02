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
