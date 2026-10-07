import { useSettings } from "../../context/SettingsContext";
import ImageCrop from "../components/ImageCrop";
import ImageUploadButton from "../components/ImageUploadButton";
import ui from "../admin.module.css";

/**
 * Login page, Sign-up page, and the homepage sign-in popup each get their
 * own independent image — set once here rather than three separate places.
 */
export default function AdminAuthImages() {
  const { authPanels, updateAuthPanel } = useSettings();

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Login / Sign up</h1>
          <p className={ui.pageSub}>
            Separate photos for the Login page, the Sign-up page, and the
            homepage sign-in popup. Drag to reposition, scroll to zoom.
          </p>
        </div>
      </div>

      <div className={ui.panel} style={{ padding: 20, marginBottom: 24 }}>
        <PanelEditor
          label="Login page"
          hint="Laptop only — always hidden on phones."
          panel={authPanels.login}
          onChange={(patch) => updateAuthPanel("login", patch)}
          showCopy
          dualCrop
          mobileAspect="3 / 4"
          desktopAspect="4 / 3"
          precisionNote="Set these separately since the page shows the photo as a tall
            faded backdrop on a phone but a wide side panel on a laptop."
        />
      </div>

      <div className={ui.panel} style={{ padding: 20, marginBottom: 24 }}>
        <PanelEditor
          label="Sign-up page"
          hint="Laptop only — always hidden on phones."
          panel={authPanels.signup}
          onChange={(patch) => updateAuthPanel("signup", patch)}
          showCopy
          dualCrop
          mobileAspect="3 / 4"
          desktopAspect="4 / 3"
          precisionNote="Set these separately since the page shows the photo as a tall
            faded backdrop on a phone but a wide side panel on a laptop."
        />
      </div>

      <div className={ui.panel} style={{ padding: 20 }}>
        <PanelEditor
          label="Homepage sign-in popup"
          hint="Shows on both phone and laptop — its own image, separate from the two above."
          panel={authPanels.popup}
          onChange={(patch) => updateAuthPanel("popup", patch)}
          dualCrop
          mobileAspect="9 / 16"
          desktopAspect="1 / 1"
          precisionNote="Set these separately since the popup shows the photo at a very
            different shape on a phone (narrow strip) versus a laptop
            (wider panel)."
        />
      </div>
    </div>
  );
}

function PanelEditor({
  label,
  hint,
  panel,
  onChange,
  showCopy = false,
  dualCrop = false,
  mobileAspect = "9 / 16",
  desktopAspect = "1 / 1",
  precisionNote,
}) {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: "1.1rem" }}>{label}</h2>
      <p className={ui.pageSub} style={{ marginBottom: 14, fontSize: "0.86rem" }}>
        {hint}
      </p>

      <div className={ui.catField} style={{ marginBottom: 14 }}>
        <span className={ui.catLabel}>Image</span>
        <ImageUploadButton
          folder="pages"
          label={panel.image ? "Replace image" : "+ Upload image"}
          onUploaded={(u) => onChange({ image: u })}
        />
      </div>

      {panel.image && !dualCrop && (
        <div style={{ maxWidth: 260, marginBottom: 16 }}>
          <ImageCrop
            src={panel.image}
            label="Crop"
            aspect="3 / 4"
            value={panel.crop}
            onChange={(crop) => onChange({ crop })}
          />
        </div>
      )}

      {panel.image && dualCrop && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ maxWidth: 160 }}>
            <ImageCrop
              src={panel.image}
              label="Mobile crop"
              aspect={mobileAspect}
              value={panel.crop?.mobile}
              onChange={(crop) =>
                onChange({ crop: { ...panel.crop, mobile: crop } })
              }
            />
          </div>
          <div style={{ maxWidth: 220 }}>
            <ImageCrop
              src={panel.image}
              label="Laptop crop"
              aspect={desktopAspect}
              value={panel.crop?.desktop}
              onChange={(crop) =>
                onChange({ crop: { ...panel.crop, desktop: crop } })
              }
            />
          </div>
        </div>
      )}

      {dualCrop && panel.image && precisionNote && (
        <p className={ui.pageSub} style={{ fontSize: "0.8rem", marginTop: -8, marginBottom: 16 }}>
          {precisionNote}
        </p>
      )}

      {showCopy && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
          <label className={ui.catField} style={{ flex: "1 1 220px" }}>
            <span className={ui.catLabel}>Headline</span>
            <input
              className={ui.catInput}
              value={panel.headline}
              onChange={(e) => onChange({ headline: e.target.value })}
              placeholder="e.g. Carry Better."
            />
          </label>
          <label className={ui.catField} style={{ flex: "1 1 220px" }}>
            <span className={ui.catLabel}>Tagline</span>
            <input
              className={ui.catInput}
              value={panel.tagline}
              onChange={(e) => onChange({ tagline: e.target.value })}
              placeholder="e.g. Designed for everyday movement."
            />
          </label>
        </div>
      )}

      {showCopy && (
        <label className={ui.catField}>
          <span className={ui.catLabel}>Accent colour</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              value={panel.accent || "#0a0a0a"}
              onChange={(e) => onChange({ accent: e.target.value })}
              style={{ width: 44, height: 38, padding: 2, border: "1px solid var(--line)", borderRadius: 6 }}
            />
            <input
              className={ui.catInput}
              style={{ maxWidth: 140 }}
              value={panel.accent || ""}
              onChange={(e) => onChange({ accent: e.target.value })}
              placeholder="#0a0a0a"
            />
          </div>
          <span className={ui.pageSub} style={{ fontSize: "0.82rem" }}>
            Colours the divider line and icons in the "Secure Checkout / Easy
            Returns / Order Tracking" row underneath the form.
          </span>
        </label>
      )}
    </div>
  );
}
