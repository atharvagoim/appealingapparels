import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllReviews, deleteReviewApi } from "../../api/reviewsApi";
import { Stars } from "../../components/StarRating";
import ui from "../admin.module.css";
import styles from "./AdminReviews.module.css";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const RATING_TABS = ["All", "5★", "4★", "3★", "2★", "1★"];
const SORTS = [
  { key: "newest", label: "Latest to old" },
  { key: "oldest", label: "Old to latest" },
  { key: "high", label: "Rating: high to low" },
  { key: "low", label: "Rating: low to high" },
];

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ratingTab, setRatingTab] = useState("All");
  const [sort, setSort] = useState("newest");
  const [busyId, setBusyId] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllReviews()
      .then(setReviews)
      .catch((e) => setError(e?.response?.data?.message || "Couldn't load reviews."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (r) => {
    if (
      !window.confirm(
        `Delete this ${r.rating}-star review by ${r.user?.name || r.name || "a customer"}? It will be removed from the website immediately.`
      )
    )
      return;
    setBusyId(r.id);
    try {
      await deleteReviewApi(r.id);
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      alert(e?.response?.data?.message || "Couldn't delete that review.");
    } finally {
      setBusyId("");
    }
  };

  const stats = useMemo(() => {
    const count = reviews.length;
    const sum = reviews.reduce((n, r) => n + r.rating, 0);
    return { count, average: count ? Math.round((sum / count) * 10) / 10 : 0 };
  }, [reviews]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = reviews;

    if (ratingTab !== "All") {
      const n = Number(ratingTab[0]);
      list = list.filter((r) => r.rating === n);
    }
    if (q) {
      list = list.filter((r) =>
        [r.name, r.user?.name, r.user?.email, r.product?.name, r.product?.code, r.body]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    const time = (r) => new Date(r.createdAt).getTime() || 0;
    const out = [...list];
    if (sort === "oldest") out.sort((a, b) => time(a) - time(b));
    else if (sort === "high") out.sort((a, b) => b.rating - a.rating || time(b) - time(a));
    else if (sort === "low") out.sort((a, b) => a.rating - b.rating || time(b) - time(a));
    else out.sort((a, b) => time(b) - time(a));
    return out;
  }, [reviews, query, ratingTab, sort]);

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Reviews</h1>
          <p className={ui.pageSub}>
            {stats.count} review{stats.count === 1 ? "" : "s"}
            {stats.count ? ` • ${stats.average} average` : ""}
          </p>
        </div>
        <div className={ui.headActions}>
          <button className={`${ui.btn} ${ui.btnGhost}`} onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.bar}>
        <input
          className={styles.search}
          placeholder="Search by customer, product, code or review text…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className={styles.chips} role="tablist" aria-label="Filter by rating">
          {RATING_TABS.map((t) => (
            <button
              key={t}
              className={`${styles.chip} ${ratingTab === t ? styles.chipOn : ""}`}
              onClick={() => setRatingTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label className={styles.sortWrap}>
          <span className={styles.sortLabel}>Sort by</span>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort reviews"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>Loading…</p>
        </div>
      ) : error ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>{error}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>
            {reviews.length ? "No reviews match that filter." : "No reviews yet."}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {shown.map((r) => (
            <div className={styles.review} key={r.id}>
              {r.product?.images?.[0] ? (
                <img className={styles.thumb} src={r.product.images[0]} alt="" />
              ) : (
                <span className={styles.thumbBlank} />
              )}

              <div className={styles.body}>
                <div className={styles.topLine}>
                  <Stars value={r.rating} size={16} />
                  <span className={styles.ratingNum}>{r.rating}.0</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.date}>{fmt(r.createdAt)}</span>
                </div>

                <p className={styles.product}>
                  {r.product?.slug ? (
                    <Link
                      className={styles.productLink}
                      to={`/product/${r.product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.product?.name || r.productName || "Product"}
                    </Link>
                  ) : (
                    r.product?.name || r.productName || "Product removed"
                  )}
                  {r.product?.code && (
                    <span className={styles.code}> · {r.product.code}</span>
                  )}
                </p>

                <p className={styles.author}>
                  {r.user?.name || r.name || "Customer"}
                  {r.user?.email && (
                    <span className={styles.email}> · {r.user.email}</span>
                  )}
                </p>

                {r.body ? (
                  <p className={styles.text}>{r.body}</p>
                ) : (
                  <p className={styles.noText}>Rating only — no written review.</p>
                )}
              </div>

              <button
                className={styles.deleteBtn}
                onClick={() => remove(r)}
                disabled={busyId === r.id}
              >
                {busyId === r.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
