import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminLogin.module.css";

/**
 * Dedicated sign-in shown at /admin when the visitor isn't an admin.
 * Keeps the URL on /admin (no redirect to the customer login) and only
 * lets accounts with role "admin" through. Real enforcement is still the
 * server's admin-only routes — this is the gate in front of them.
 */
export default function AdminLogin() {
  const { login, logout, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      if (!u || u.role !== "admin") {
        // valid account, but not an admin — drop the session
        logout();
        setError("This account doesn't have admin access.");
      }
      // if admin: the gate re-renders and the dashboard appears automatically
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>APPEALING APPARELS</p>
        <h1 className={styles.title}>Admin sign in</h1>
        <p className={styles.sub}>Authorised staff only.</p>

        {isAuthenticated && user && user.role !== "admin" && (
          <p className={styles.note}>
            You're signed in as {user.email}, which isn't an admin account.
          </p>
        )}

        <form className={styles.form} onSubmit={submit}>
          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className={styles.submit} type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <a href="/" className={styles.back}>
          ← Back to store
        </a>
      </div>
    </div>
  );
}
