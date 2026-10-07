import { useState } from "react";
import { uploadProductImages } from "../../api/uploadApi";
import styles from "./ImageUploadButton.module.css";

/**
 * Pick one image from the computer, upload it to ImageKit (via the backend)
 * and hand the hosted URL back through onUploaded(url).
 */
export default function ImageUploadButton({
  folder,
  onUploaded,
  label = "+ Upload image",
  hint = "JPG, PNG or WEBP — up to 8MB.",
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handle = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const [url] = await uploadProductImages([fileList[0]], folder);
      if (url) onUploaded(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <label className={`${styles.btn} ${busy ? styles.busy : ""}`}>
          {busy ? "Uploading…" : label}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={busy}
            onChange={(e) => {
              handle(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
