import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";
import styles from "./SearchBar.module.css";

// The three homepage sections always filter the Shop page by this exact
// category key, regardless of what admin has renamed the display title to.
const SECTION_KEYS = [
  { key: "New Arrivals", titleKey: "newArrivals" },
  { key: "Best Sellers", titleKey: "bestSellers" },
  { key: "Clearance Sale", titleKey: "clearance" },
];

const MAX_ITEMS = 3;

const ALL_TABS = [
  { key: "suggestions", label: "Suggestions" },
  { key: "products", label: "Products" },
  { key: "collections", label: "Collections" },
];

export default function SearchBar({ value, onChange, placeholder = "Search Bags" }) {
  const navigate = useNavigate();
  const { products, categories } = useProducts();
  const { sectionTitles, searchSuggestions } = useSettings();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("suggestions");
  const wrapRef = useRef(null);

  const cleanCategories = useMemo(
    () => categories.filter((c) => c && c.toLowerCase() !== "uncategorised"),
    [categories]
  );

  const sections = useMemo(
    () =>
      SECTION_KEYS.map((s) => ({
        key: s.key,
        title: sectionTitles?.[s.titleKey] || s.key,
      })),
    [sectionTitles]
  );

  // The "Suggestions" tab: admin's own list (Admin → Sections) if they've
  // set one — free text, so picking one just runs it as a search rather
  // than jumping to a fixed page. Otherwise it falls back to real
  // categories only (not sections — those live under Collections). This
  // tab only ever shows when the box is empty — see ALL_TABS filtering
  // below — so it never needs to filter by a typed query.
  const suggestionItems = useMemo(() => {
    if (searchSuggestions?.length) {
      return searchSuggestions.slice(0, MAX_ITEMS).map((s) => ({ type: "suggested", label: s, query: s }));
    }
    return cleanCategories
      .slice(0, MAX_ITEMS)
      .map((c) => ({ type: "category", label: c, to: `/shop?category=${encodeURIComponent(c)}` }));
  }, [searchSuggestions, cleanCategories]);

  const productItems = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name?.toLowerCase().includes(q)) : products;
    return list
      .slice(0, MAX_ITEMS)
      .map((p) => ({ type: "product", label: p.name, to: `/product/${p.slug}` }));
  }, [value, products]);

  const collectionItems = useMemo(() => {
    const q = value.trim().toLowerCase();
    const cats = (q ? cleanCategories.filter((c) => c.toLowerCase().includes(q)) : cleanCategories)
      .map((c) => ({ type: "category", label: c, to: `/shop?category=${encodeURIComponent(c)}` }));
    const secs = (q ? sections.filter((s) => s.title.toLowerCase().includes(q)) : sections)
      .map((s) => ({ type: "section", label: s.title, to: `/shop?category=${encodeURIComponent(s.key)}` }));
    return [...secs, ...cats].slice(0, MAX_ITEMS);
  }, [value, cleanCategories, sections]);

  const activeItems =
    tab === "products" ? productItems : tab === "collections" ? collectionItems : suggestionItems;

  // Suggestions only makes sense before anyone's typed anything — once
  // there's a query, it disappears from the tab row completely rather than
  // just going inactive.
  const visibleTabs = value.trim()
    ? ALL_TABS.filter((t) => t.key !== "suggestions")
    : ALL_TABS.filter((t) => t.key === "suggestions");

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onEscape = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const go = (suggestion) => {
    setOpen(false);
    if (suggestion.to) {
      navigate(suggestion.to);
    } else if (suggestion.query) {
      onChange(suggestion.query);
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>

      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label="Search products"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          setOpen(true);
          // Typing for the first time moves focus off the plain
          // "Suggestions" list onto live Products results, matching how
          // the tabs are meant to be used — Suggestions stays reachable by
          // clicking it, it just isn't the default anymore once you type.
          if (next.trim() && tab === "suggestions") setTab("products");
          if (!next.trim()) setTab("suggestions");
        }}
      />

      {(value || open) && (
        <button
          type="button"
          className={styles.clear}
          aria-label={value ? "Clear search" : "Close suggestions"}
          onClick={() => {
            onChange("");
            setTab("suggestions");
            setOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {open && (
        <div className={styles.suggestions}>
          {visibleTabs.length > 1 && (
            <div className={styles.tabRow}>
              {visibleTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.tab} ${tab === t.key ? styles.tabOn : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {activeItems.length > 0 ? (
            <ul className={styles.list}>
              {activeItems.map((s, i) => (
                <Suggestion key={`${s.type}-${s.label}-${i}`} s={s} onPick={go} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              {tab === "products"
                ? "No products match."
                : tab === "collections"
                ? "No categories or sections match."
                : "No suggestions set yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}


function Suggestion({ s, onPick }) {
  return (
    <li>
      <button type="button" className={styles.item} onClick={() => onPick(s)}>
        <span className={styles.itemLabel}>{s.label}</span>
      </button>
    </li>
  );
}
