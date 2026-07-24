import { useEffect, useRef, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import ImageCrop from "../components/ImageCrop";
import ui from "../admin.module.css";
import styles from "./AdminCover.module.css";

// A curated set of vivid duotone gradients in the style of Canva's gradient
// picker, for the announcement bar background.
const GRADIENT_PRESETS = [
  { name: "Sunset", value: "linear-gradient(90deg, #ff512f, #f09819)" },
  { name: "Purple Bliss", value: "linear-gradient(90deg, #7f00ff, #e100ff)" },
  { name: "Ocean", value: "linear-gradient(90deg, #2193b0, #6dd5ed)" },
  { name: "Peach", value: "linear-gradient(90deg, #ed4264, #ffedbc)" },
  { name: "Mint", value: "linear-gradient(90deg, #00b09b, #96c93d)" },
  { name: "Berry", value: "linear-gradient(90deg, #8e2de2, #4a00e0)" },
  { name: "Flamingo", value: "linear-gradient(90deg, #f857a6, #ff5858)" },
  { name: "Sky", value: "linear-gradient(90deg, #4facfe, #00f2fe)" },
  { name: "Gold", value: "linear-gradient(90deg, #f7971e, #ffd200)" },
  { name: "Midnight", value: "linear-gradient(90deg, #232526, #414345)" },
  { name: "Rose Gold", value: "linear-gradient(90deg, #f4c4f3, #fc67fa)" },
  { name: "Emerald", value: "linear-gradient(90deg, #11998e, #38ef7d)" },
];

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
  </svg>
);
const DragIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="6" r="1.5" /><circle cx="16" cy="6" r="1.5" />
    <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
    <circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="18" r="1.5" />
  </svg>
);
const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);
const ResetIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 1 3 6.7" />
    <path d="M3 16v-4h4" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function AdminCover() {
  const {
    coverImages,
    setCoverImages,
    addCoverImage,
    updateCoverImage,
    updateCoverCrop,
    removeCoverImage,
    moveCoverImage,
    resetCovers,
    announcement,
    updateAnnouncement,
  } = useSettings();
  const [url, setUrl] = useState("");
  const [link, setLink] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [newTagline, setNewTagline] = useState("");
  const [gradientMenuOpen, setGradientMenuOpen] = useState(false);
  const gradientRef = useRef(null);

  useEffect(() => {
    if (!gradientMenuOpen) return;
    const onClick = (e) => {
      if (gradientRef.current && !gradientRef.current.contains(e.target)) {
        setGradientMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [gradientMenuOpen]);

  const { enabled, animated, bgColor, bgGradient, textColor, taglines } = announcement;

  const addTagline = () => {
    if (!newTagline.trim()) return;
    updateAnnouncement({ taglines: [...taglines, newTagline.trim()] });
    setNewTagline("");
  };
  const editTagline = (i, value) =>
    updateAnnouncement({ taglines: taglines.map((t, idx) => (idx === i ? value : t)) });
  const removeTagline = (i) =>
    updateAnnouncement({ taglines: taglines.filter((_, idx) => idx !== i) });

  const add = () => {
    if (!url.trim()) return;
    addCoverImage(url, link);
    setUrl("");
    setLink("");
  };

  const expanded = expandedIndex != null ? coverImages[expandedIndex] : null;

  // ---- drag-and-drop reordering ----
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const onRowDragStart = (i) => (e) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const onRowDragOver = (i) => (e) => {
    e.preventDefault();
    if (i !== dragOverIndex) setDragOverIndex(i);
  };
  const onRowDrop = (i) => (e) => {
    e.preventDefault();
    if (dragIndex == null || dragIndex === i) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...coverImages];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setCoverImages(next);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const onRowDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <span className={styles.headIcon}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="M21 16l-5-5L5 20" />
            </svg>
          </span>
          <div>
            <h1 className={ui.pageTitle}>Cover</h1>
            <p className={ui.pageSub}>
              The announcement bar and the homepage slideshow — the two things that
              sit at the very top of the store. {coverImages.length}{" "}
              {coverImages.length === 1 ? "image" : "images"} in rotation.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={() => {
            if (window.confirm("Reset cover images to the defaults?")) resetCovers();
          }}
        >
          <ResetIcon /> Reset to defaults
        </button>
      </div>

      <div className={styles.grid}>
        {/* ------------------------------------- left half: announcement bar */}
        <div className={styles.leftCol}>
          {/* announcement bar */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Announcement bar</h2>
            <p className={styles.cardSub}>The strip at the very top of the site, above the header.</p>

            <div className={ui.toggleRow}>
              <div className={ui.toggleText}>
                <strong>Show announcement bar</strong>
                <span className={ui.toggleSub}>
                  {enabled ? "Live at the top of every page." : "Hidden."}
                </span>
              </div>
              <button
                type="button"
                className={`${ui.toggle} ${enabled ? ui.toggleOn : ""}`}
                onClick={() => updateAnnouncement({ enabled: !enabled })}
                aria-pressed={enabled}
                aria-label="Toggle announcement bar"
              >
                <span className={ui.toggleKnob} />
              </button>
            </div>

            <div className={ui.toggleRow}>
              <div className={ui.toggleText}>
                <strong>Animate — scroll right to left</strong>
                <span className={ui.toggleSub}>
                  {animated ? "Taglines scroll continuously." : "Taglines sit still, separated by dots."}
                </span>
              </div>
              <button
                type="button"
                className={`${ui.toggle} ${animated ? ui.toggleOn : ""}`}
                onClick={() => updateAnnouncement({ animated: !animated })}
                aria-pressed={animated}
                aria-label="Toggle announcement bar animation"
              >
                <span className={ui.toggleKnob} />
              </button>
            </div>

            <div className={ui.toggleRow} style={{ flexWrap: "wrap", gap: 20 }}>
              <label className={ui.colorField}>
                <span className={ui.catLabel} style={{ marginRight: 6 }}>Bar colour</span>
                <input
                  type="color"
                  className={ui.colorSwatch}
                  value={bgColor}
                  onChange={(e) => updateAnnouncement({ bgColor: e.target.value, bgGradient: "" })}
                />
                <span className={ui.colorHex}>{bgColor}</span>
              </label>
              <label className={ui.colorField}>
                <span className={ui.catLabel} style={{ marginRight: 6 }}>Text colour</span>
                <input
                  type="color"
                  className={ui.colorSwatch}
                  value={textColor}
                  onChange={(e) => updateAnnouncement({ textColor: e.target.value })}
                />
                <span className={ui.colorHex}>{textColor}</span>
              </label>
            </div>

            <div style={{ paddingTop: 14, paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
              <span className={ui.catLabel}>Or pick a gradient</span>
              <div className={styles.gradientPicker} ref={gradientRef} style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className={styles.gradientTrigger}
                  onClick={() => setGradientMenuOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={gradientMenuOpen}
                >
                  <span
                    className={styles.gradientPreviewDot}
                    style={{ background: bgGradient || bgColor }}
                  />
                  <span style={{ flex: 1, textAlign: "left" }}>
                    {bgGradient
                      ? GRADIENT_PRESETS.find((g) => g.value === bgGradient)?.name || "Gradient"
                      : "Solid colour"}
                  </span>
                  <ChevronIcon />
                </button>

                {gradientMenuOpen && (
                  <div className={styles.gradientMenu} role="listbox">
                    <button
                      type="button"
                      className={`${styles.gradientOption} ${!bgGradient ? styles.gradientOptionOn : ""}`}
                      style={{ background: bgColor }}
                      onClick={() => {
                        updateAnnouncement({ bgGradient: "" });
                        setGradientMenuOpen(false);
                      }}
                      aria-label="Solid colour"
                      title="Solid colour"
                    />
                    {GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.name}
                        type="button"
                        className={`${styles.gradientOption} ${
                          bgGradient === g.value ? styles.gradientOptionOn : ""
                        }`}
                        style={{ background: g.value }}
                        onClick={() => {
                          updateAnnouncement({ bgGradient: g.value });
                          setGradientMenuOpen(false);
                        }}
                        aria-label={g.name}
                        title={g.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ paddingTop: 14 }}>
              <span className={ui.catLabel}>Taglines</span>
              <div style={{ marginTop: 10 }}>
                {taglines.map((t, i) => (
                  <div className={ui.taglineRow} key={i}>
                    <input
                      className={ui.catInput}
                      value={t}
                      onChange={(e) => editTagline(i, e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.iconBtnSm}
                      onClick={() => removeTagline(i)}
                      aria-label="Remove tagline"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.addRow} style={{ marginTop: 8 }}>
                <input
                  placeholder="Add a tagline, e.g. Free returns within 7 days"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTagline()}
                />
                <button type="button" className={styles.addBtn} onClick={addTagline}>
                  Add tagline <PlusIcon />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* -------------------------------------- right half: cover images */}
        <div className={styles.rightCol}>
          {/* cover images — add new */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Cover images</h2>
            <p className={styles.cardSub} style={{ marginBottom: 14 }}>
              Add a new photo to the homepage slideshow.
            </p>
            <div className={styles.addRow}>
              <input
                placeholder="Image URL (https://…  or  /path/to/image.jpg)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <input
                placeholder="Link when clicked (optional)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <button type="button" className={styles.addBtn} onClick={add}>
                Add image <PlusIcon />
              </button>
            </div>
          </div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              Your cover images ({coverImages.length}/3)
            </h2>

            {coverImages.length === 0 ? (
              <p className={styles.cardSub} style={{ marginTop: 10 }}>
                No cover images yet — add one on the left.
              </p>
            ) : (
              <div style={{ marginTop: 16 }}>
                {coverImages.map((cover, i) => (
                  <div
                    key={i}
                    className={`${styles.coverRow} ${expandedIndex === i ? styles.coverRowOn : ""} ${
                      dragOverIndex === i && dragIndex !== null && dragIndex !== i
                        ? styles.coverRowDragOver
                        : ""
                    } ${dragIndex === i ? styles.coverRowDragging : ""}`}
                    onClick={() => setExpandedIndex(i)}
                    draggable
                    onDragStart={onRowDragStart(i)}
                    onDragOver={onRowDragOver(i)}
                    onDrop={onRowDrop(i)}
                    onDragEnd={onRowDragEnd}
                  >
                    <span className={styles.numBadge}>
                      <span className={styles.numDot}>{i + 1}</span>
                    </span>
                    <span className={styles.coverThumb}>
                      {cover.image ? (
                        <img src={cover.image} alt="" />
                      ) : (
                        <span className={styles.coverThumbEmpty}>No image</span>
                      )}
                    </span>
                    <span className={styles.coverInfo}>
                      <strong>Cover #{i + 1}</strong>
                      <span>{cover.link || "No link"}</span>
                    </span>
                    <span className={styles.coverIcons}>
                      {cover.link && (
                        <a
                          href={cover.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.iconBtnSm}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Preview link"
                        >
                          <ExpandIcon />
                        </a>
                      )}
                      <button
                        type="button"
                        className={`${styles.iconBtnSm} ${styles.iconBtnDanger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCoverImage(i);
                          if (expandedIndex === i) setExpandedIndex(null);
                        }}
                        aria-label="Delete cover image"
                      >
                        <TrashIcon />
                      </button>
                      <span className={styles.dragHandle}>
                        <DragIcon />
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.tip}>
              <span>ℹ️</span>
              <span>
                <strong>Tip:</strong> drag a row by its handle (⠿) to reorder. Maximum
                3 images are shown.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- expanded editor */}
      {expanded && (
        <div className={styles.overlay} onClick={() => setExpandedIndex(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <span className={styles.modalThumb}>
                {expanded.image && <img src={expanded.image} alt="" />}
              </span>
              <div className={styles.modalTitleWrap}>
                <strong>Cover #{expandedIndex + 1}</strong>
                <span>{expanded.link || "No link"}</span>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setExpandedIndex(null)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <label className={styles.modalField}>
              <span>Image URL</span>
              <input
                value={expanded.image}
                onChange={(e) => updateCoverImage(expandedIndex, { image: e.target.value })}
              />
            </label>
            <label className={styles.modalField}>
              <span>Link (where it goes when clicked)</span>
              <input
                value={expanded.link || ""}
                onChange={(e) => updateCoverImage(expandedIndex, { link: e.target.value })}
                placeholder="/shop  ·  leave blank for no link"
              />
            </label>

            <div className={styles.cropCols}>
              <ImageCrop
                src={expanded.image}
                label="PHONE VIEW"
                aspect="4 / 3"
                value={expanded.mobile}
                onChange={(c) => updateCoverCrop(expandedIndex, "mobile", c)}
              />
              <ImageCrop
                src={expanded.image}
                label="LAPTOP VIEW"
                aspect="16 / 9"
                value={expanded.laptop}
                onChange={(c) => updateCoverCrop(expandedIndex, "laptop", c)}
              />
            </div>

            <div className={styles.modalFoot}>
              <span className={styles.modalFootNum}>#{expandedIndex + 1}</span>
              <button
                type="button"
                className={styles.modalMoveBtn}
                onClick={() => {
                  moveCoverImage(expandedIndex, -1);
                  setExpandedIndex((i) => Math.max(i - 1, 0));
                }}
                disabled={expandedIndex === 0}
                aria-label="Move earlier"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.modalMoveBtn}
                onClick={() => {
                  moveCoverImage(expandedIndex, 1);
                  setExpandedIndex((i) => Math.min(i + 1, coverImages.length - 1));
                }}
                disabled={expandedIndex === coverImages.length - 1}
                aria-label="Move later"
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.modalRemove}
                onClick={() => {
                  removeCoverImage(expandedIndex);
                  setExpandedIndex(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
