import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import AuthShell from "../components/AuthShell.jsx";
import { MailIcon, LockIcon, UserIcon, PhoneIcon } from "../components/AuthIcons.jsx";
import styles from "./Auth.module.css";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      await register(name, email, phone, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      panelKey="signup"
      eyebrow="Join us"
      title="Create your account"
      subtitle="Save your wishlist and check out faster next time."
    >
      <form className={styles.form} onSubmit={submit}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.nameRow}>
          <label className={styles.field}>
            <span className={styles.label}>First name</span>
            <span className={styles.fieldWrap}>
              <span className={styles.fieldIcon}>
                <UserIcon />
              </span>
              <input
                className={styles.input}
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Last name</span>
            <span className={styles.fieldWrap}>
              <span className={styles.fieldIcon}>
                <UserIcon />
              </span>
              <input
                className={styles.input}
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </span>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Email address</span>
          <span className={styles.fieldWrap}>
            <span className={styles.fieldIcon}>
              <MailIcon />
            </span>
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Phone number</span>
          <span className={styles.fieldWrap}>
            <span className={styles.fieldIcon}>
              <PhoneIcon />
            </span>
            <input
              className={styles.input}
              type="tel"
              autoComplete="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <span className={styles.fieldWrap}>
            <span className={styles.fieldIcon}>
              <LockIcon />
            </span>
            <PasswordInput
              className={styles.input}
              autoComplete="new-password"
              minLength={6}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </span>
        </label>

        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className={styles.alt}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthShell>
  );
}
