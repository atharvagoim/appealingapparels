import { createContext, useContext, useEffect, useState } from "react";
import { useApi, TOKEN_KEY } from "../api/client";
import { loginApi, registerApi, getMeApi } from "../api/authApi";

const AuthContext = createContext();

const readMessage = (err) =>
  err?.response?.data?.error || err?.message || "Something went wrong";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only "loading" while we verify an existing token on first paint.
  const [loading, setLoading] = useState(
    useApi && Boolean(localStorage.getItem(TOKEN_KEY))
  );

  // Hydrate the session from a stored token.
  useEffect(() => {
    if (!useApi) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let active = true;
    getMeApi()
      .then((u) => active && setUser(u))
      .catch(() => {
        // token invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const persist = ({ token, user: u }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  };

  const login = async (email, password) => {
    if (!useApi) throw new Error("Accounts require the backend. Set VITE_API_URL.");
    try {
      return persist(await loginApi(email, password));
    } catch (err) {
      throw new Error(readMessage(err));
    }
  };

  const register = async (name, email, password) => {
    if (!useApi) throw new Error("Accounts require the backend. Set VITE_API_URL.");
    try {
      return persist(await registerApi(name, email, password));
    } catch (err) {
      throw new Error(readMessage(err));
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
