import { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";

export default function AdminSizeChart() {
  const { sizeChartImage, setSizeChartImage } = useSettings();
  const [url, setUrl] = useState(sizeChartImage || "");

  useEffect(() => {
    setUrl(sizeChartImage || "");
  }, [sizeChartImage]);

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Size chart</h1>
          <p className={ui.pageSub}>
            One generic size chart image, shown to shoppers when they tap “View
            Size Chart” on any product.
          </p>
        </div>
      </div>

      <div className={ui.addBox}>
        <input
          className={ui.addInput}
          placeholder="Size chart image URL (https://…  or  /size-chart.jpg)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSizeChartImage(url)}
        />
        <button className={ui.btn} onClick={() => setSizeChartImage(url)}>
          Save
        </button>
      </div>

      {sizeChartImage ? (
        <div className={ui.panel} style={{ padding: 16 }}>
          <img
            src={sizeChartImage}
            alt="Size chart"
            style={{ display: "block", width: "100%", maxWidth: 640, height: "auto" }}
          />
          <div style={{ marginTop: 12 }}>
            <button
              className={`${ui.linkBtn} ${ui.linkDanger}`}
              onClick={() => {
                if (window.confirm("Remove the size chart image?")) {
                  setSizeChartImage("");
                  setUrl("");
                }
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>No size chart yet.</p>
          <p className={ui.emptyBody}>
            Paste an image URL above. Until then, shoppers see a standard
            measurements table.
          </p>
        </div>
      )}
    </div>
  );
}
