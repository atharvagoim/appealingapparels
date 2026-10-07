import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../api/authApi";
import PasswordInput from "../components/PasswordInput";
import AuthShell from "../components/AuthShell.jsx";
import { LockIcon } from "../components/AuthIcons.jsx";
import styles from "./Auth.module.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await resetPasswordApi(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "This reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account"
      title="Set a new password"
      subtitle={!token || done ? undefined : "Choose a new password for your account."}
    >
      {!token ? (
        <>
          <p className={styles.error}>
            This page needs a valid reset link. Please request a new one.
          </p>
          <p className={styles.alt}>
            <Link to="/forgot-password">Request a reset link</Link>
          </p>
        </>
      ) : done ? (
        <>
          <p className={styles.sub}>
            Your password has been updated. Taking you to the sign-in page…
          </p>
          <p className={styles.alt}>
            <Link to="/login">Login now</Link>
          </p>
        </>
      ) : (
        <>
          {error && <p className={styles.error}>{error}</p>}

          <form className={styles.form} onSubmit={submit}>
            <label className={styles.field}>
              <span className={styles.label}>New password</span>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <LockIcon />
                </span>
                <PasswordInput
                  className={styles.input}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirm new password</span>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <LockIcon />
                </span>
                <PasswordInput
                  className={styles.input}
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </span>
            </label>

            <button className={styles.submit} type="submit" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>

          <p className={styles.alt}>
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
