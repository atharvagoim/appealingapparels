import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import useDocumentMeta from "../hooks/useDocumentMeta";
import styles from "./About.module.css";

export default function About() {
  const { about } = useSettings();

  useDocumentMeta("About us", (about?.body || "").slice(0, 155));

  // Body is one editable text block; blank lines separate paragraphs.
  const paragraphs = (about?.body || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.textCol}>
          <div className={styles.textInner}>
            {about?.eyebrow && <p className={styles.eyebrow}>{about.eyebrow}</p>}
            <h1 className={styles.title}>{about?.title}</h1>

            <div className={styles.body}>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <Link to="/" className={styles.button}>
              {about?.buttonLabel || "Back to website"}
            </Link>
          </div>
        </div>

        <div className={styles.imageCol}>
          {about?.image && (
            <img
              className={styles.image}
              src={about.image}
              alt={about?.title || "About us"}
            />
          )}
        </div>
      </section>
    </main>
  );
}
