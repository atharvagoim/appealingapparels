import { useState } from "react";
import styles from "./PasswordInput.module.css";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-7 0-10.5-7-10.5-7a18.6 18.6 0 0 1 4.2-5.2M9.9 4.2A9.7 9.7 0 0 1 12 5c7 0 10.5 7 10.5 7a18.4 18.4 0 0 1-2.2 3.2" />
    <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

/**
 * Drop-in replacement for <input type="password">, with an eye icon to
 * toggle visibility. Pass the caller's own input className (border, font,
 * etc.) — the right-side padding for the icon is applied inline so it can't
 * be fought by CSS module ordering.
 */
export default function PasswordInput({
  className,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
  id,
  name,
  ...rest
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.wrap}>
      <input
        id={id}
        name={name}
        className={className}
        style={{ paddingRight: 42 }}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        {...rest}
      />
      <button
        type="button"
        className={styles.eyeBtn}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
