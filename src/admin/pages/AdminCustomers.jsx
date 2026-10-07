import { useEffect, useMemo, useState } from "react";
import { fetchCustomers, fetchCustomer } from "../../api/adminUsersApi";
import { viewInvoice } from "../../api/ordersApi";
import ui from "../admin.module.css";
import styles from "./AdminCustomers.module.css";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | buyers | prospects

  const [openId, setOpenId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchCustomers()
      .then(setRows)
      .catch((e) => setError(e?.response?.data?.message || "Couldn't load customers."))
      .finally(() => setLoading(false));
  }, []);

  const open = async (id) => {
    if (openId === id) {
      setOpenId("");
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await fetchCustomer(id));
    } catch {
      setError("Couldn't load that customer.");
    } finally {
      setDetailLoading(false);
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "buyers" && r.orders === 0) return false;
      if (filter === "prospects" && r.orders > 0) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone].filter(Boolean).some((v) =>
        String(v).toLowerCase().includes(q)
      );
    });
  }, [rows, query, filter]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Customers</h1>
          <p className={ui.pageSub}>
            {rows.length} registered · {rows.filter((r) => r.orders > 0).length} have ordered
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search by name, email or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.filters}>
          {[
            ["all", "All"],
            ["buyers", "Has orders"],
            ["prospects", "No orders"],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`${styles.chip} ${filter === k ? styles.chipOn : ""}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>Loading…</p>
        </div>
      ) : shown.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>No customers match.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {shown.map((r) => {
            const isOpen = openId === r.id;
            return (
              <div className={styles.card} key={r.id}>
                <button className={styles.row} onClick={() => open(r.id)}>
                  <div className={styles.rowMain}>
                    <p className={styles.name}>{r.name}</p>
                    <p className={styles.meta}>
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </p>
                  </div>
                  <div className={styles.rowStats}>
                    <span className={styles.stat}>
                      {r.orders} order{r.orders === 1 ? "" : "s"}
                    </span>
                    <span className={styles.stat}>{inr(r.spend)} spent</span>
                    <span className={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className={styles.detail}>
                    {detailLoading || !detail ? (
                      <p className={styles.meta}>Loading details…</p>
                    ) : (
                      <>
                        <div className={styles.detailGrid}>
                          <section>
                            <h3 className={styles.detailTitle}>Contact</h3>
                            <p>{detail.name}</p>
                            <p className={styles.copyRow}>
                              {detail.email}
                              <button className={styles.copyBtn} onClick={() => copy(detail.email)}>
                                Copy
                              </button>
                            </p>
                            <p className={styles.copyRow}>
                              {detail.phone || "No phone"}
                              {detail.phone && (
                                <button className={styles.copyBtn} onClick={() => copy(detail.phone)}>
                                  Copy
                                </button>
                              )}
                            </p>
                            <p className={styles.meta}>Joined {fmtDate(detail.createdAt)}</p>
                          </section>

                          <section>
                            <h3 className={styles.detailTitle}>
                              Saved addresses ({detail.addresses.length})
                            </h3>
                            {detail.addresses.length === 0 ? (
                              <p className={styles.meta}>None saved.</p>
                            ) : (
                              detail.addresses.map((a) => (
                                <div className={styles.addr} key={a._id}>
                                  <p className={styles.addrLabel}>
                                    {a.label || "Home"}
                                    {a.isDefault ? " · default" : ""}
                                  </p>
                                  <p className={styles.meta}>
                                    {a.fullName}, {a.line1}, {a.city}, {a.state} — {a.postalCode} ·{" "}
                                    {a.phone}
                                  </p>
                                  <button
                                    className={styles.copyBtn}
                                    onClick={() =>
                                      copy(
                                        `${a.fullName}, ${a.line1}, ${a.city}, ${a.state} - ${a.postalCode}, ${a.phone}`
                                      )
                                    }
                                  >
                                    Copy address
                                  </button>
                                </div>
                              ))
                            )}
                          </section>
                        </div>

                        <h3 className={styles.detailTitle}>Orders ({detail.orders.length})</h3>
                        {detail.orders.length === 0 ? (
                          <p className={styles.meta}>No orders yet.</p>
                        ) : (
                          <div className={styles.orders}>
                            {detail.orders.map((o) => (
                              <div className={styles.order} key={o._id}>
                                <div className={styles.orderTop}>
                                  <span className={styles.orderNo}>
                                    {o.orderNumber || `#${String(o._id).slice(-6).toUpperCase()}`}
                                  </span>
                                  <span
                                    className={`${styles.status} ${
                                      o.status === "pending" ? styles.statusBad : ""
                                    }`}
                                  >
                                    {o.status}
                                  </span>
                                  <span className={styles.meta}>
                                    {fmtDate(o.createdAt)} · {inr(o.amounts?.total)}
                                  </span>
                                </div>
                                <div className={styles.thumbs}>
                                  {(o.items || []).map((i, n) => (
                                    <div className={styles.thumbWrap} key={n} title={i.name}>
                                      {i.image ? (
                                        <img className={styles.thumb} src={i.image} alt={i.name} />
                                      ) : (
                                        <div className={styles.thumbBlank} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {o.status !== "pending" && (
                                  <button
                                    className={styles.copyBtn}
                                    onClick={async () => {
                                      try {
                                        await viewInvoice(o._id);
                                      } catch {
                                        alert("Couldn't open that invoice.");
                                      }
                                    }}
                                  >
                                    View invoice
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
