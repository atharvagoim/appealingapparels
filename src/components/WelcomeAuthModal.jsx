import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import PasswordInput from "./PasswordInput.jsx";
import { MailIcon, LockIcon, UserIcon, PhoneIcon } from "./AuthIcons.jsx";
import { TRUST_ITEMS } from "./TrustBadges.jsx";
import styles from "./WelcomeAuthModal.module.css";

const LAST_SHOWN_KEY = "aa_welcome_modal_last_shown";
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * A login/signup prompt shown on the homepage for anyone not signed in — at
 * most once every 6 hours. The cooldown is stamped the moment it's decided
 * to show (before the visitor touches anything), so closing it, ignoring
 * it, or refreshing the page all leave it retired for the rest of that
 * 6-hour window. Signing in or creating an account both close it
 * immediately.
 */
export default function WelcomeAuthModal() {
  const { isAuthenticated, loading, login, register } = useAuth();
  const { authPanels } = useSettings();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState("login");

  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || isAuthenticated) return;
    const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || 0);
    if (Date.now() - lastShown < COOLDOWN_MS) return;
    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    setVisible(true);
  }, [loading, isAuthenticated]);

  if (!visible) return null;

  const close = () => setVisible(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier, password);
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name, email, phone, password);
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const popup = authPanels?.popup;
  const image = popup?.image;

  return (
    <div className={styles.backdrop} onClick={close}>
      <div
        className={`${styles.modal} ${!image ? styles.noImage : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in or create an account"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          ✕
        </button>

        {image && (
          <div className={styles.imageCol}>
            <img
              src={image}
              alt=""
              className={styles.image}
              style={{
                "--pop-x-m": `${popup?.crop?.mobile?.x ?? 50}%`,
                "--pop-y-m": `${popup?.crop?.mobile?.y ?? 50}%`,
                "--pop-zoom-m": popup?.crop?.mobile?.zoom ?? 1,
                "--pop-x-d": `${popup?.crop?.desktop?.x ?? 50}%`,
                "--pop-y-d": `${popup?.crop?.desktop?.y ?? 50}%`,
                "--pop-zoom-d": popup?.crop?.desktop?.zoom ?? 1,
              }}
            />
          </div>
        )}

        <div className={styles.formCol}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === "login" ? styles.tabOn : ""}`}
              onClick={() => {
                setTab("login");
                setError("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === "signup" ? styles.tabOn : ""}`}
              onClick={() => {
                setTab("signup");
                setError("");
              }}
            >
              Sign up
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {tab === "login" ? (
            <form className={styles.form} onSubmit={submitLogin}>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <MailIcon />
                </span>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="username"
                  placeholder="Email or phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </span>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <LockIcon />
                </span>
                <PasswordInput
                  className={styles.input}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </span>

              <div className={styles.rowBetween}>
                <span />
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>

              <button className={styles.submit} type="submit" disabled={busy}>
                {busy ? "Logging in…" : "Login"}
              </button>

              <p className={styles.alt}>
                Don't have an account?{" "}
                <button
                  type="button"
                  className={styles.altLink}
                  onClick={() => {
                    setTab("signup");
                    setError("");
                  }}
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form className={styles.form} onSubmit={submitSignup}>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <UserIcon />
                </span>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </span>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <MailIcon />
                </span>
                <input
                  className={styles.input}
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </span>
              <span className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <PhoneIcon />
                </span>
                <input
                  className={styles.input}
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </span>
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

              <button className={styles.submit} type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>

              <p className={styles.alt}>
                Already have an account?{" "}
                <button
                  type="button"
                  className={styles.altLink}
                  onClick={() => {
                    setTab("login");
                    setError("");
                  }}
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {tab === "login" && (
            <ul className={styles.trustRow}>
              {TRUST_ITEMS.map((t) => (
                <li className={styles.trustItem} key={t.title}>
                  <span className={styles.trustIcon}>{t.icon}</span>
                  <span>
                    <span className={styles.trustTitle}>{t.title}</span>
                    <span className={styles.trustSub}>{t.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
