import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../api/authApi";
import AuthShell from "../components/AuthShell.jsx";
import { MailIcon } from "../components/AuthIcons.jsx";
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
    <AuthShell
      eyebrow="Account"
      title="Forgot password"
      subtitle={
        sent
          ? undefined
          : "Enter your email and we'll send you a link to set a new password."
      }
    >
      {sent ? (
        <>
          <p className={styles.sub}>
            If an account exists for <strong>{email}</strong>, we've emailed a
            link to reset your password. Please check your inbox — and your
            spam folder.
          </p>
          <p className={styles.sub} style={{ marginTop: 8 }}>
            The link expires in 60 minutes and can only be used once.
          </p>
          <p className={styles.alt}>
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          {error && <p className={styles.error}>{error}</p>}

          <form className={styles.form} onSubmit={submit}>
            <label className={styles.field}>
              <span className={styles.label}>Email address</span>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <MailIcon />
                </span>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </span>
            </label>

            <button className={styles.submit} type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className={styles.alt}>
            Remembered it? <Link to="/login">Login</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
