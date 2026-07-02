import styles from "./EditorialBanner.module.css";
import useReveal from "../useReveal.js";

export default function EditorialBanner() {
  const [ref, shown] = useReveal();
  return (
    <section
      className={`${styles.banner} ${shown ? styles.shown : ""}`}
      ref={ref}
      aria-label="The atelier"
    >
      <div className={styles.media}>
        <img
          src="https://picsum.photos/seed/aa-atelier/1400/1000?grayscale"
          alt="Inside the atelier, garments being finished by hand"
          loading="lazy"
        />
      </div>
      <div className={`${styles.inner} shell`}>
        <p className="eyebrow">From the atelier</p>
        <h2 className={styles.title}>
          One pattern, refined
          <br />
          across a decade.
        </h2>
        <p className={styles.body}>
          Every piece begins as a single block and is reworked season after
          season until nothing is left to remove. The result is a small,
          deliberate collection meant to outlast the trend cycle entirely.
        </p>
        <a href="#" className={styles.link}>
          Read our approach
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
