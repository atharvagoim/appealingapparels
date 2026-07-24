import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";

export default function AdminStore() {
  const { storeInfo, updateStoreInfo } = useSettings();
  const { address, addressNote, hoursLabel, hoursValue, mapsUrl, mapQuery } =
    storeInfo || {};

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Store</h1>
          <p className={ui.pageSub}>
            Shown in the "Visit our store" section on the homepage — address,
            hours and the Get Directions link.
          </p>
        </div>
      </div>

      <div className={ui.panel} style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 640, padding: 20 }}>
        <label className={ui.catField}>
          <span className={ui.catLabel}>Address</span>
          <input
            className={ui.catInput}
            value={address || ""}
            onChange={(e) => updateStoreInfo({ address: e.target.value })}
            placeholder="e.g. Model Town, Delhi, India"
          />
        </label>

        <label className={ui.catField}>
          <span className={ui.catLabel}>Address note (small line under the address)</span>
          <input
            className={ui.catInput}
            value={addressNote || ""}
            onChange={(e) => updateStoreInfo({ addressNote: e.target.value })}
            placeholder="e.g. Easily find us in the heart of Model Town."
          />
        </label>

        <label className={ui.catField}>
          <span className={ui.catLabel}>Exact map location</span>
          <input
            className={ui.catInput}
            value={mapQuery || ""}
            onChange={(e) => updateStoreInfo({ mapQuery: e.target.value })}
            placeholder="e.g. 28.712345,77.187654  or  Appealing Apparels, Model Town"
          />
          <span className={ui.catLabel} style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            Where the map pin drops. Paste the shop's coordinates (right-click the
            shop in Google Maps → click the lat/long to copy) or its exact place
            name. Leave blank and we'll read coordinates from the directions link
            below, falling back to the written address.
          </span>
        </label>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <label className={ui.catField} style={{ flex: "1 1 220px" }}>
            <span className={ui.catLabel}>Hours label</span>
            <input
              className={ui.catInput}
              value={hoursLabel || ""}
              onChange={(e) => updateStoreInfo({ hoursLabel: e.target.value })}
              placeholder="e.g. Open Every Day"
            />
          </label>
          <label className={ui.catField} style={{ flex: "1 1 220px" }}>
            <span className={ui.catLabel}>Hours</span>
            <input
              className={ui.catInput}
              value={hoursValue || ""}
              onChange={(e) => updateStoreInfo({ hoursValue: e.target.value })}
              placeholder="e.g. 11:00 AM – 9:00 PM"
            />
          </label>
        </div>

        <label className={ui.catField}>
          <span className={ui.catLabel}>Get Directions link (Google Maps URL)</span>
          <input
            className={ui.catInput}
            value={mapsUrl || ""}
            onChange={(e) => updateStoreInfo({ mapsUrl: e.target.value })}
            placeholder="https://maps.google.com/…"
          />
          <span className={ui.catLabel} style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            The "Get Directions" button only shows on the homepage once this is filled in.
          </span>
        </label>
      </div>
    </div>
  );
}
