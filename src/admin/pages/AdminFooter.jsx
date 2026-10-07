import { useSettings } from "../../context/SettingsContext";
import ImageUploadButton from "../components/ImageUploadButton";
import ui from "../admin.module.css";
import styles from "./AdminFooter.module.css";

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
    <path d="M10 11.5v6M14 11.5v6" />
  </svg>
);

const PLATFORMS = [
  "Instagram",
  "Facebook",
  "Twitter / X",
  "YouTube",
  "Pinterest",
  "TikTok",
  "LinkedIn",
  "WhatsApp",
  "Other",
];

export default function AdminFooter() {
  const { footer, updateFooter, addSocialLink, updateSocialLink, removeSocialLink, about, updateAbout } =
    useSettings();
  const { phone, email, socialLinks } = footer;

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Footer</h1>
          <p className={ui.pageSub}>
            Contact details and social links shown in the site footer — no
            need to touch the .env file anymore.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={ui.panel} style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: "1.1rem" }}>Contact</h2>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label className={ui.catField} style={{ flex: "1 1 240px" }}>
                <span className={ui.catLabel}>Phone</span>
                <input
                  className={ui.catInput}
                  value={phone}
                  onChange={(e) => updateFooter({ phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                />
              </label>
              <label className={ui.catField} style={{ flex: "1 1 240px" }}>
                <span className={ui.catLabel}>Email</span>
                <input
                  className={ui.catInput}
                  value={email}
                  onChange={(e) => updateFooter({ email: e.target.value })}
                  placeholder="e.g. hello@appealingapparels.com"
                />
              </label>
            </div>
          </div>

          <div className={ui.panel} style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: "1.1rem" }}>Social links</h2>
            <p className={ui.pageSub} style={{ marginBottom: 14 }}>
              Shown as icons in the footer. Add as many as you like.
            </p>

            {socialLinks.length === 0 && (
              <p style={{ color: "var(--ink-faint, #6a6a6a)", fontSize: "0.9rem", marginBottom: 14 }}>
                No social links yet.
              </p>
            )}

            {socialLinks.map((s, i) => (
              <div className={ui.taglineRow} key={i} style={{ alignItems: "flex-start" }}>
                <select
                  className={ui.catInput}
                  style={{ flex: "0 0 170px" }}
                  value={s.platform}
                  onChange={(e) => updateSocialLink(i, { platform: e.target.value })}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  className={ui.catInput}
                  value={s.url}
                  onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                  placeholder="https://…"
                />
                <button
                  type="button"
                  className={ui.deleteIconBtn}
                  onClick={() => removeSocialLink(i)}
                  aria-label={`Remove ${s.platform || "social"} link`}
                  title="Remove link"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}

            <button className={`${ui.btn} ${ui.btnGhost}`} onClick={addSocialLink} style={{ marginTop: 8 }}>
              + Add social link
            </button>
          </div>
        </div>

        <div className={styles.col}>
          <div className={ui.panel} style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: "1.1rem" }}>About us page</h2>
            <p className={ui.pageSub} style={{ marginBottom: 14 }}>
              Shown at <strong>/about</strong> (linked from the footer). Leave a
              blank line between paragraphs.
            </p>

            <label className={ui.catField} style={{ marginBottom: 12 }}>
              <span className={ui.catLabel}>Eyebrow (small label above the heading)</span>
              <input
                className={ui.catInput}
                value={about.eyebrow}
                onChange={(e) => updateAbout({ eyebrow: e.target.value })}
                placeholder="e.g. About us"
              />
            </label>

            <label className={ui.catField} style={{ marginBottom: 12 }}>
              <span className={ui.catLabel}>Heading</span>
              <input
                className={ui.catInput}
                value={about.title}
                onChange={(e) => updateAbout({ title: e.target.value })}
                placeholder="e.g. Designed To Go Everywhere"
              />
            </label>

            <label className={ui.catField} style={{ marginBottom: 12 }}>
              <span className={ui.catLabel}>Body</span>
              <textarea
                className={ui.catInput}
                rows={7}
                value={about.body}
                onChange={(e) => updateAbout({ body: e.target.value })}
                placeholder="Write your story. Leave a blank line between paragraphs."
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
            </label>

            <div className={ui.catField} style={{ marginBottom: 12 }}>
              <span className={ui.catLabel}>Image</span>
              <ImageUploadButton
                folder="pages"
                label={about.image ? "Replace image" : "+ Upload image"}
                onUploaded={(u) => updateAbout({ image: u })}
              />
            </div>

            {about.image && (
              <img
                src={about.image}
                alt="About preview"
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 12,
                  display: "block",
                }}
              />
            )}

            <label className={ui.catField}>
              <span className={ui.catLabel}>Button label</span>
              <input
                className={ui.catInput}
                value={about.buttonLabel}
                onChange={(e) => updateAbout({ buttonLabel: e.target.value })}
                placeholder="e.g. Back to website"
              />
            </label>
            <p className={ui.pageSub} style={{ marginTop: 8 }}>
              The button always returns visitors to the homepage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
