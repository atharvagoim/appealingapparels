import { useEffect, useState } from "react";
import styles from "./CountdownTimer.module.css";

function timeLeft(target) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function Flip({ value, label }) {
  return (
    <div className={styles.unit}>
      <span className={styles.card}>{String(value).padStart(2, "0")}</span>
      <span className={styles.unitLabel}>{label}</span>
    </div>
  );
}

/** Compact flip-clock countdown. Renders nothing once the target passes. */
export default function CountdownTimer({ endsAt }) {
  const target = endsAt ? new Date(endsAt).getTime() : null;
  const [left, setLeft] = useState(() => (target ? timeLeft(target) : null));

  useEffect(() => {
    if (!target) {
      setLeft(null);
      return;
    }
    setLeft(timeLeft(target));
    const id = setInterval(() => setLeft(timeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target || !left) return null;

  return (
    <div className={styles.timer} aria-label="Sale ends in">
      <Flip value={left.days} label="Days" />
      <span className={styles.sep}>:</span>
      <Flip value={left.hours} label="Hrs" />
      <span className={styles.sep}>:</span>
      <Flip value={left.minutes} label="Mins" />
      <span className={styles.sep}>:</span>
      <Flip value={left.seconds} label="Secs" />
    </div>
  );
}
