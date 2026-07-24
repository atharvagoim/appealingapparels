import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";

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
  const { footer, updateFooter, addSocialLink, updateSocialLink, removeSocialLink } =
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

      <div className={ui.panel} style={{ padding: 20, marginBottom: 24, maxWidth: 640 }}>
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

      <div className={ui.panel} style={{ padding: 20, maxWidth: 640 }}>
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
  );
}
