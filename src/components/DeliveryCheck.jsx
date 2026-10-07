import { useState } from "react";
import { estimateDelivery, isValidPincode, formatShortDate } from "../utils/deliveryEstimate";
import styles from "./DeliveryCheck.module.css";

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.4" />
  </svg>
);

const TruckIcon = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 6.5h11v9h-11z" />
    <path d="M13.5 10h4l3 2.7v2.8h-7z" />
    <circle cx="6.5" cy="18" r="1.7" />
    <circle cx="17" cy="18" r="1.7" />
  </svg>
);

/**
 * Shown on the product page below the buy buttons — lets a shopper check
 * roughly when their order would arrive, before they buy. The estimate
 * itself is a fully offline, manual approximation (see
 * utils/deliveryEstimate.js) — no live courier lookup.
 */
export default function DeliveryCheck() {
  const [pincode, setPincode] = useState("");
  const [checked, setChecked] = useState("");
  const [error, setError] = useState("");

  const result = checked ? estimateDelivery(checked) : null;

  const check = (e) => {
    e.preventDefault();
    if (!isValidPincode(pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }
    setError("");
    setChecked(pincode.trim());
  };

  const change = () => {
    setChecked("");
    setPincode("");
    setError("");
  };

  return (
    <div className={styles.card}>
      <p className={styles.title}>Check Delivery Date :</p>

      {!checked ? (
        <form className={styles.row} onSubmit={check}>
          <span className={styles.inputWrap}>
            <span className={styles.icon}>
              <PinIcon />
            </span>
            <input
              className={styles.input}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter Pincode"
              inputMode="numeric"
              maxLength={6}
            />
          </span>
          <button className={styles.btn} type="submit">
            Check
          </button>
        </form>
      ) : (
        <div className={styles.row}>
          <span className={styles.inputWrap}>
            <span className={styles.icon}>
              <PinIcon />
            </span>
            <span className={styles.value}>{checked}</span>
          </span>
          <button type="button" className={styles.btn} onClick={change}>
            Change
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.result}>
          <span className={styles.resultIcon}>
            <TruckIcon />
          </span>
          <span>
            Expected Delivery Between{" "}
            <strong>
              {formatShortDate(result.minDate)} – {formatShortDate(result.maxDate)}
            </strong>
          </span>
        </div>
      )}

      {!checked && !error && (
        <p className={styles.hint}>
          Enter your pincode to check <strong>delivery date</strong>
        </p>
      )}
    </div>
  );
}
