import { useState } from "react";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!email.includes("@")) return;
    setDone(true);
  };

  return (
    <section className={styles.section} aria-labelledby="nl-title">
      <div className={`${styles.inner} shell`}>
        <h2 id="nl-title" className={styles.title}>
          First look, every season.
        </h2>
        <p className={styles.copy}>
          Early access to new arrivals, restocks and atelier notes. No noise.
        </p>

        {done ? (
          <p className={styles.thanks}>You're on the list. Welcome.</p>
        ) : (
          <div className={styles.field}>
            <input
              type="email"
              className={styles.input}
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button className={styles.submit} onClick={submit}>
              Join
            </button>
          </div>
        )}
        <p className={styles.fine}>By joining you agree to our privacy policy.</p>
      </div>
    </section>
  );
}
