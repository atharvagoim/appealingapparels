import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../api/authApi";
import styles from "./Auth.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setBusy(true);
    try {
      await forgotPasswordApi(email.trim());
      setSent(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Couldn't send the reset email. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className="eyebrow">Account</p>
        <h1 className={styles.title}>Forgot password</h1>

        {sent ? (
          <>
            <p className={styles.sub}>
              If an account exists for <strong>{email}</strong>, we've emailed a
              link to reset your password. Please check your inbox — and your
              spam folder.
            </p>
            <p className={styles.sub}>
              The link expires in 60 minutes and can only be used once.
            </p>
            <p className={styles.alt}>
              <Link to="/login">Back to log in</Link>
            </p>
          </>
        ) : (
          <>
            <p className={styles.sub}>
              Enter your email and we'll send you a link to set a new password.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.form} onSubmit={submit}>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <button className={styles.submit} type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className={styles.alt}>
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
