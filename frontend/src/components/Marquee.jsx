import styles from "./Marquee.module.css";

const WORDS = [
  "Linen",
  "Silk",
  "Organic cotton",
  "Hand-finished",
  "Made to last",
  "Carbon-considered",
  "Grade-A cashmere",
];

export default function Marquee() {
  const track = [...WORDS, ...WORDS];
  return (
    <div className={styles.wrap} aria-label="What we stand for">
      <div className={styles.track}>
        {track.map((w, i) => (
          <span key={i} className={styles.word} aria-hidden={i >= WORDS.length}>
            {w}
            <span className={styles.star} aria-hidden="true">
              ✳
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
