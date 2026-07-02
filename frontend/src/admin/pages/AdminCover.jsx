import { useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";

export default function AdminCover() {
  const {
    coverImages,
    addCoverImage,
    removeCoverImage,
    moveCoverImage,
    resetCovers,
  } = useSettings();
  const [url, setUrl] = useState("");

  const add = () => {
    addCoverImage(url);
    setUrl("");
  };

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Cover images</h1>
          <p className={ui.pageSub}>
            {coverImages.length}{" "}
            {coverImages.length === 1 ? "image" : "images"} — they rotate as a
            slideshow at the top of the homepage
          </p>
        </div>
        <div className={ui.headActions}>
          <button
            className={`${ui.btn} ${ui.btnGhost}`}
            onClick={() => {
              if (window.confirm("Reset cover images to the defaults?"))
                resetCovers();
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className={ui.addBox}>
        <input
          className={ui.addInput}
          placeholder="Paste an image URL (https://…  or  /path/to/image.jpg)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className={ui.btn} onClick={add}>
          Add image
        </button>
      </div>

      {coverImages.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>No cover images.</p>
          <p className={ui.emptyBody}>Add one above to show it on the homepage.</p>
        </div>
      ) : (
        <div className={ui.coverGrid}>
          {coverImages.map((src, i) => (
            <div className={ui.coverCard} key={`${src}-${i}`}>
              <img className={ui.coverImg} src={src} alt={`Cover ${i + 1}`} />
              <div className={ui.coverBar}>
                <span className={ui.coverNum}>#{i + 1}</span>
                <div className={ui.coverActions}>
                  <button
                    className={ui.iconBtn}
                    onClick={() => moveCoverImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    className={ui.iconBtn}
                    onClick={() => moveCoverImage(i, 1)}
                    disabled={i === coverImages.length - 1}
                    aria-label="Move later"
                  >
                    ↓
                  </button>
                  <button
                    className={`${ui.linkBtn} ${ui.linkDanger}`}
                    onClick={() => removeCoverImage(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
