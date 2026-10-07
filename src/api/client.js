import axios from "axios";

// The API now lives in this same deployment (api/index.js), so the default
// is a same-origin relative path — no separate backend URL to configure.
// Set VITE_API_URL only if the API is ever split into its own service again.
export const API_URL = import.meta.env.VITE_API_URL || "/api";
export const useApi = Boolean(API_URL);


export const TOKEN_KEY = "token";

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
