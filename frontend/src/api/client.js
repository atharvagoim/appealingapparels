import axios from "axios";

// When VITE_API_URL is set, the app talks to the Phase 4/5 backend.
// When it's empty/undefined, the app stays on its localStorage store.
export const API_URL = import.meta.env.VITE_API_URL || "https://appealing-apparels-z7d6.onrender.com/api";
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
