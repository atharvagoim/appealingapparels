import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";
import styles from "./AdminSocial.module.css";

const PLATFORMS = ["Facebook", "Instagram", "Twitter / X", "YouTube", "WhatsApp"];

/** Line icons available for the three highlight columns. */
const ICONS = ["users", "bell", "tag", "star", "truck"];

const BLANK_STATS = [
  { icon: "users", value: "", label: "" },
  { icon: "bell", value: "", label: "" },
  { icon: "tag", value: "", label: "" },
];

/** Sensible accent per platform, applied when you switch the dropdown. */
const PLATFORM_ACCENT = {
  Facebook: "#1a53e3",
  Instagram: "#c42a70",
  "Twitter / X": "#111111",
  YouTube: "#e0322b",
  WhatsApp: "#128c4b",
};

export default function AdminSocial() {
  const { socialFollow, updateSocialFollow } = useSettings();
  const s = socialFollow || {};
  const set = (patch) => updateSocialFollow(patch);

  const platform = s.platform || "Facebook";

  // Always edit exactly three columns, padding out anything missing.
  const stats = BLANK_STATS.map((blank, i) => ({ ...blank, ...(s.stats?.[i] || {}) }));
  const setStat = (i, key, value) =>
    set({ stats: stats.map((x, idx) => (idx === i ? { ...x, [key]: value } : x)) });
  const live = s.enabled && String(s.url || "").trim();

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Social</h1>
          <p className={ui.pageSub}>
            The "Follow us" banner on the homepage, between Clearance Sale and
            Visit our store.{" "}
            {live
              ? "Live right now."
              : "Hidden — switch it on and add a page link to show it."}
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ------------------------------------------------- the section itself */}
        <div className={ui.panel} style={{ padding: 20 }}>
          <h2 className={styles.cardTitle}>Section</h2>

          <div className={ui.toggleRow}>
            <div className={ui.toggleText}>
              <strong>Show the banner</strong>
              <span className={ui.toggleSub}>
                {s.enabled
                  ? "Visible on the homepage (a page link is still required)."
                  : "Hidden from the homepage."}
              </span>
            </div>
            <button
              type="button"
              className={`${ui.toggle} ${s.enabled ? ui.toggleOn : ""}`}
              onClick={() => set({ enabled: !s.enabled })}
              aria-pressed={!!s.enabled}
              aria-label="Toggle the follow-us banner"
            >
              <span className={ui.toggleKnob} />
            </button>
          </div>

          <div className={styles.fields}>
            <label className={ui.catField}>
              <span className={ui.catLabel}>Platform</span>
              <select
                className={ui.catInput}
                value={platform}
                onChange={(e) => {
                  const next = e.target.value;
                  set({
                    platform: next,
                    accent: PLATFORM_ACCENT[next] || s.accent,
                    heading: `Follow us on ${next}`,
                    buttonLabel: `Visit our ${next} Page`,
                  });
                }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className={ui.catField}>
              <span className={ui.catLabel}>Heading</span>
              <input
                className={ui.catInput}
                value={s.heading || ""}
                onChange={(e) => set({ heading: e.target.value })}
                placeholder={`Follow us on ${platform}`}
              />
            </label>

            <label className={ui.catField}>
              <span className={ui.catLabel}>Subtext</span>
              <textarea
                className={`${ui.catInput} ${styles.textarea}`}
                rows={2}
                value={s.subtext || ""}
                onChange={(e) => set({ subtext: e.target.value })}
                placeholder="Stay updated with new arrivals, exclusive offers & more!"
              />
            </label>

            <label className={ui.catField}>
              <span className={ui.catLabel}>Button label</span>
              <input
                className={ui.catInput}
                value={s.buttonLabel || ""}
                onChange={(e) => set({ buttonLabel: e.target.value })}
                placeholder={`Visit our ${platform} Page`}
              />
            </label>

            <label className={ui.catField}>
              <span className={ui.catLabel}>Page link</span>
              <input
                className={ui.catInput}
                value={s.url || ""}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="https://www.facebook.com/yourpage"
              />
              <span className={styles.hint}>
                The banner stays hidden until this is filled in.
              </span>
            </label>

            <label className={ui.catField}>
              <span className={ui.catLabel}>Accent colour</span>
              <div className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={s.accent || "#1a53e3"}
                  onChange={(e) => set({ accent: e.target.value })}
                  aria-label="Accent colour"
                />
                <input
                  className={ui.catInput}
                  value={s.accent || ""}
                  onChange={(e) => set({ accent: e.target.value })}
                  placeholder="#1a53e3"
                />
              </div>
              <span className={styles.hint}>
                Used for the logo tile and the call-to-action button.
              </span>
            </label>
          </div>
        </div>

        {/* --------------------------------------------------- proof points */}
        <div className={ui.panel} style={{ padding: 20 }}>
          <h2 className={styles.cardTitle}>Highlights</h2>
          <p className={styles.cardSub}>
            The three short points shown beside the button. Leave a value and
            label blank to drop that column.
          </p>

          <div className={styles.fields}>
            {stats.map((stat, i) => (
              <div className={styles.statCard} key={i}>
                <span className={styles.statNum}>{i + 1}</span>

                <label className={ui.catField}>
                  <span className={ui.catLabel}>Icon</span>
                  <select
                    className={ui.catInput}
                    value={stat.icon || "users"}
                    onChange={(e) => setStat(i, "icon", e.target.value)}
                  >
                    {ICONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={ui.catField}>
                  <span className={ui.catLabel}>Value</span>
                  <input
                    className={ui.catInput}
                    value={stat.value || ""}
                    onChange={(e) => setStat(i, "value", e.target.value)}
                    placeholder="20K+"
                  />
                </label>

                <label className={ui.catField}>
                  <span className={ui.catLabel}>Label</span>
                  <input
                    className={ui.catInput}
                    value={stat.label || ""}
                    onChange={(e) => setStat(i, "label", e.target.value)}
                    placeholder="Followers"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
