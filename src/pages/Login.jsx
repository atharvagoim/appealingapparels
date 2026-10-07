import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import AuthShell from "../components/AuthShell.jsx";
import { MailIcon, LockIcon } from "../components/AuthIcons.jsx";
import styles from "./Auth.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(identifier, password);
      navigate(from || (user.role === "admin" ? "/admin" : "/"), {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      panelKey="login"
      eyebrow="Welcome back"
      title="Login to continue"
      subtitle="Access your orders, wishlist and exclusive launches."
    >
      <form className={styles.form} onSubmit={submit}>
        {error && <p className={styles.error}>{error}</p>}

        <label className={styles.field}>
          <span className={styles.label}>Email or phone number</span>
          <span className={styles.fieldWrap}>
            <span className={styles.fieldIcon}>
              <MailIcon />
            </span>
            <input
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder="Enter your email or phone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldHead}>
            <span className={styles.label}>Password</span>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot Password?
            </Link>
          </span>
          <span className={styles.fieldWrap}>
            <span className={styles.fieldIcon}>
              <LockIcon />
            </span>
            <PasswordInput
              className={styles.input}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </span>
        </label>

        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Login"}
        </button>
      </form>

      <p className={styles.alt}>
        Don't have an account? <Link to="/signup">Create one</Link>
      </p>
    </AuthShell>
  );
}
