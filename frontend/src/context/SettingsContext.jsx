import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useApi } from "../api/client";
import { fetchSettings, updateSettingsApi } from "../api/settingsApi";

const SettingsContext = createContext();
const STORAGE_KEY = "site-settings";

const DEFAULT_COVERS = [
  "https://picsum.photos/seed/aa-cover-1/1600/2000?grayscale",
  "https://picsum.photos/seed/aa-cover-2/1600/2000?grayscale",
  "https://picsum.photos/seed/aa-cover-3/1600/2000?grayscale",
];

const DEFAULT_CATEGORIES = [
  { label: "T-Shirts", image: "https://picsum.photos/seed/aa-cat-tshirt/1400/900?grayscale", link: "/shop?category=T-Shirts" },
  { label: "Hoodies", image: "https://picsum.photos/seed/aa-cat-hoodie/1400/900?grayscale", link: "/shop?category=Hoodies" },
  { label: "Bottoms", image: "https://picsum.photos/seed/aa-cat-bottoms/1400/900?grayscale", link: "/shop?category=Bottoms" },
];

function initialLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        coverImages: Array.isArray(parsed.coverImages) && parsed.coverImages.length
          ? parsed.coverImages
          : DEFAULT_COVERS,
        categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_CATEGORIES,
      };
    }
  } catch {
    /* ignore */
  }
  return { coverImages: DEFAULT_COVERS, categories: DEFAULT_CATEGORIES };
}

/**
 * Site-wide visual settings (cover slideshow + shop-by-category tiles).
 *
 * Dual-mode, mirroring ProductsContext:
 *  - VITE_API_URL set  → reads/writes through the Express API (GET/PUT
 *    /settings). Stored in Mongo, so every browser and device sees the same
 *    thing. Admin edits are persisted server-side.
 *  - VITE_API_URL unset → localStorage (standalone, per-browser).
 */
export function SettingsProvider({ children }) {
  const local = useApi ? { coverImages: [], categories: [] } : initialLocal();
  const [coverImages, setCoverImagesState] = useState(local.coverImages);
  const [categories, setCategoriesState] = useState(local.categories);
  const [loading, setLoading] = useState(useApi);

  // API mode: load once on mount. Fall back to defaults if the request fails
  // (e.g. backend without the settings route yet) so the storefront still renders.
  useEffect(() => {
    if (!useApi) return;
    let active = true;
    fetchSettings()
      .then((data) => {
        if (!active) return;
        setCoverImagesState(
          Array.isArray(data.coverImages) && data.coverImages.length
            ? data.coverImages
            : DEFAULT_COVERS
        );
        setCategoriesState(
          Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES
        );
      })
      .catch(() => {
        if (!active) return;
        setCoverImagesState(DEFAULT_COVERS);
        setCategoriesState(DEFAULT_CATEGORIES);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Local mode: persist on every change.
  useEffect(() => {
    if (useApi) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ coverImages, categories }));
  }, [coverImages, categories]);

  // Push a change to the server (admin JWT is attached by the axios interceptor).
  // Debounced + merged so typing in a field doesn't fire a request per keystroke.
  const pendingRef = useRef({});
  const timerRef = useRef(null);
  const save = (patch) => {
    if (!useApi) return;
    pendingRef.current = { ...pendingRef.current, ...patch };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const payload = pendingRef.current;
      pendingRef.current = {};
      updateSettingsApi(payload).catch((err) =>
        console.error("Failed to save settings", err?.response?.data || err?.message)
      );
    }, 500);
  };

  /* ---------- cover images ---------- */
  const setCoverImages = (images) => {
    setCoverImagesState(images);
    save({ coverImages: images });
  };
  const addCoverImage = (url) => {
    const clean = (url || "").trim();
    if (!clean) return;
    const next = [...coverImages, clean];
    setCoverImages(next);
  };
  const removeCoverImage = (index) => {
    setCoverImages(coverImages.filter((_, i) => i !== index));
  };
  const moveCoverImage = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= coverImages.length) return;
    const next = [...coverImages];
    [next[index], next[to]] = [next[to], next[index]];
    setCoverImages(next);
  };
  const resetCovers = () => setCoverImages(DEFAULT_COVERS);

  /* ---------- shop-by-category tiles ---------- */
  const setCategories = (cats) => {
    setCategoriesState(cats);
    save({ categories: cats });
  };
  const addCategory = () =>
    setCategories([...categories, { label: "New category", image: "", link: "/shop" }]);
  const updateCategory = (index, patch) =>
    setCategories(categories.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const removeCategory = (index) =>
    setCategories(categories.filter((_, i) => i !== index));
  const moveCategory = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= categories.length) return;
    const next = [...categories];
    [next[index], next[to]] = [next[to], next[index]];
    setCategories(next);
  };
  const resetCategories = () => setCategories(DEFAULT_CATEGORIES);

  return (
    <SettingsContext.Provider
      value={{
        loading,
        coverImages,
        setCoverImages,
        addCoverImage,
        removeCoverImage,
        moveCoverImage,
        resetCovers,
        categories,
        addCategory,
        updateCategory,
        removeCategory,
        moveCategory,
        resetCategories,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
