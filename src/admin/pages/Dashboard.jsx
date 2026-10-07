import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useProducts,
  totalStock,
  imagesOf,
  variantOutages,
} from "../../context/ProductsContext";
import { useAuth } from "../../context/AuthContext";
import { fetchAllOrders } from "../../api/ordersApi";
import NotificationBell from "../NotificationBell.jsx";
import styles from "./Dashboard.module.css";

const LOW = 3;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const ago = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const STATUS_META = {
  paid: { label: "Paid", color: "#22a45d" },
  shipped: { label: "Shipped", color: "#3b6fe0" },
  delivered: { label: "Delivered", color: "#7c5cf0" },
  pending: { label: "Pending / unpaid", color: "#f0a828" },
  cancelled: { label: "Cancelled", color: "#e0596b" },
};

/** Homepage sections a product can be dropped into, with the flag each uses
 *  and the per-section list that records which colourways to show. */
const PROMO_SECTIONS = [
  { key: "bestSellers", flag: "featured", colorsField: "featuredColors", label: "Best Sellers" },
  { key: "newArrivals", flag: "newArrival", colorsField: "newArrivalColors", label: "New Arrivals" },
  { key: "clearance", flag: "clearance", colorsField: "clearanceColors", label: "Clearance Sale" },
];

const P = {
  plus: <path d="M12 5v14M5 12h14" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5L5 20" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3.2H4v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8z" />
      <circle cx="7.7" cy="7.7" r="1.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.4" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 8 8 3l13 13-5 5z" />
      <path d="m8.5 7.5 1.5 1.5M11.5 10.5l1.5 1.5M14.5 13.5l1.5 1.5" />
    </>
  ),
  bag: (
    <>
      <path d="M6 7h12l1 13H5z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
  rupee: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h6M9 11h6M14 8c0 3-3 3-5 3l4 5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
};

function Icon({ name, size = 22, sw = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}

function Donut({ segments, total }) {
  const R = 52;
  const sw = 20;
  const C = 2 * Math.PI * R;
  const sum = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <svg viewBox="0 0 130 130" className={styles.donutSvg} role="img" aria-label="Order status breakdown">
      <circle cx="65" cy="65" r={R} fill="none" stroke="#f5f5f5" strokeWidth={sw} />
      <g transform="rotate(-90 65 65)">
        {sum > 0 &&
          segments.map((seg) => {
            const len = (seg.value / sum) * C;
            const el = (
              <circle
                key={seg.key}
                cx="65"
                cy="65"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={sw}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
              />
            );
            acc += len;
            return el;
          })}
      </g>
      <text x="65" y="61" textAnchor="middle" className={styles.donutNum}>
        {total}
      </text>
      <text x="65" y="80" textAnchor="middle" className={styles.donutLbl}>
        orders
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const { products, categories, updateProduct } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promoting, setPromoting] = useState("");
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let on = true;
    fetchAllOrders()
      .then((d) => on && setOrders(d))
      .catch(() => on && setOrders([]));
    return () => {
      on = false;
    };
  }, []);

  const list = orders || [];

  /* ---- stock analytics ---- */
  const stockUnits = products.reduce((s, p) => s + totalStock(p), 0);
  const outProducts = products.filter((p) => totalStock(p) === 0);
  const lowProducts = products.filter((p) => {
    const t = totalStock(p);
    return t > 0 && t <= LOW;
  });
  /**
   * Variant-level alerts.
   *
   * Stock no longer lives in one place: a product may be sized or free size,
   * and may carry colourways that each hold their own stock. Reading
   * `product.sizes` alone missed every coloured product, because the admin
   * form stores their sizes on the colour instead.
   */
  const outSizes = [];
  const lowSizes = [];

  products.forEach((p) => {
    const sized = p.hasSizes !== false;
    const colors = p.colors || [];

    /** Record one variant, however it's described. */
    const note = (label, stock) => {
      if (stock === 0) outSizes.push({ id: p.id, product: p.name, label });
      else if (stock <= LOW) lowSizes.push({ id: p.id, product: p.name, label, stock });
    };

    if (colors.length > 0) {
      colors.forEach((c) => {
        if (sized) {
          (c.sizes || []).forEach((sz) =>
            note(`${c.name} · size ${sz.size}`, sz.stock ?? 0)
          );
        } else {
          note(c.name, c.stock ?? 0);
        }
      });
      return;
    }

    if (sized) {
      (p.sizes || []).forEach((sz) => note(`size ${sz.size}`, sz.stock ?? 0));
    }
    // A free-size product with no colours is already covered by the
    // product-level out/low lists above, so it needs no variant row.
  });
  const alerts = [
    ...outProducts.map((p) => ({ key: `op-${p.id}`, id: p.id, level: "out", text: p.name, tag: "Out of stock" })),
    ...outSizes.map((s, i) => ({ key: `os-${i}`, id: s.id, level: "out", text: `${s.product} — ${s.label}`, tag: "Variant out" })),
    ...lowProducts.map((p) => ({ key: `lp-${p.id}`, id: p.id, level: "low", text: p.name, tag: `Low · ${totalStock(p)} left` })),
    ...lowSizes.map((s, i) => ({ key: `ls-${i}`, id: s.id, level: "low", text: `${s.product} — ${s.label}`, tag: `Low · ${s.stock} left` })),
  ];
  const alertsShown = alerts.slice(0, 9);

  /* ---- order analytics ---- */
  const by = { paid: 0, shipped: 0, delivered: 0, cancelled: 0, pending: 0 };
  list.forEach((o) => {
    if (by[o.status] !== undefined) by[o.status] += 1;
  });
  const revenue = list
    .filter((o) => ["paid", "shipped", "delivered"].includes(o.status))
    .reduce((s, o) => s + (o.amounts?.total || 0), 0);

  /** Real week-over-week revenue change — last 7 days vs the 7 before that,
   *  from actual order timestamps. Not shown at all when there's no prior-
   *  week revenue to compare against (division by zero would be meaningless,
   *  not "infinite growth"). */
  const revenueTrend = (() => {
    const eligible = list.filter((o) =>
      ["paid", "shipped", "delivered"].includes(o.status)
    );
    const now = Date.now();
    const day = 86400000;
    const sumBetween = (fromDaysAgo, toDaysAgo) =>
      eligible
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t <= now - toDaysAgo * day && t > now - fromDaysAgo * day;
        })
        .reduce((s, o) => s + (o.amounts?.total || 0), 0);
    const thisWeek = sumBetween(7, 0);
    const lastWeek = sumBetween(14, 7);
    if (!lastWeek) return null;
    const pct = ((thisWeek - lastWeek) / lastWeek) * 100;
    return { pct: Math.round(pct * 10) / 10, up: pct >= 0 };
  })();
  const segments = Object.keys(STATUS_META)
    .filter((k) => by[k] > 0)
    .map((k) => ({ key: k, label: STATUS_META[k].label, value: by[k], color: STATUS_META[k].color }));
  const segSum = segments.reduce((s, x) => s + x.value, 0);

  const weekly = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ key: d.getTime(), label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: 0 });
    }
    list.forEach((o) => {
      const t = new Date(o.createdAt);
      t.setHours(0, 0, 0, 0);
      const day = days.find((x) => x.key === t.getTime());
      if (day) day.value += 1;
    });
    return days;
  }, [orders]);
  const weeklyMax = Math.max(1, ...weekly.map((d) => d.value));

  /**
   * Sales rolled up per product. Keyed on the product id so the numbers can be
   * joined back to the catalogue for stock, price and section membership; the
   * name is only a fallback for older orders that predate the id.
   */
  const sales = useMemo(() => {
    const map = new Map();

    list.forEach((o) => {
      if (!["paid", "shipped", "delivered"].includes(o.status)) return;
      (o.items || []).forEach((it) => {
        const key = it.product ? String(it.product) : `name:${it.name}`;
        const row = map.get(key) || {
          key,
          productId: it.product ? String(it.product) : "",
          name: it.name,
          code: it.code || "",
          image: it.image || "",
          units: 0,
          revenue: 0,
          orders: new Set(),
          lastSold: null,
        };
        row.units += it.quantity || 0;
        row.revenue += (it.price || 0) * (it.quantity || 0);
        row.orders.add(o.id || o._id);
        const when = new Date(o.createdAt);
        if (!row.lastSold || when > row.lastSold) row.lastSold = when;
        map.set(key, row);
      });
    });

    // Fold in the live catalogue so never-sold products are represented too,
    // and so every row can show current stock and section membership.
    const byId = new Map(products.map((p) => [String(p.id), p]));
    const rows = [];

    map.forEach((row) => {
      const p = byId.get(row.productId);
      rows.push({
        ...row,
        orders: row.orders.size,
        product: p || null,
        stock: p ? totalStock(p) : null,
        featured: !!p?.featured,
        image: row.image || (p ? imagesOf(p)[0] : "") || "",
        code: row.code || p?.code || "",
        name: p?.name || row.name,
      });
    });

    products.forEach((p) => {
      if (map.has(String(p.id))) return;
      rows.push({
        key: String(p.id),
        productId: String(p.id),
        name: p.name,
        code: p.code || "",
        image: imagesOf(p)[0] || "",
        units: 0,
        revenue: 0,
        orders: 0,
        lastSold: null,
        product: p,
        stock: totalStock(p),
        featured: !!p.featured,
      });
    });

    return rows;
  }, [orders, products]);

  const topSelling = useMemo(
    () => sales.filter((r) => r.units > 0).sort((a, b) => b.units - a.units),
    [sales]
  );
  const topMax = topSelling[0]?.units || 1;

  /**
   * The other end of the same list. Products that have never sold come first,
   * since those are the ones actually worth acting on.
   */
  const leastSelling = useMemo(
    () => [...sales].sort((a, b) => a.units - b.units || a.name.localeCompare(b.name)),
    [sales]
  );

  // Both panels start at five rows and expand to the whole list on request.
  const [showAllTop, setShowAllTop] = useState(false);
  const [showAllLeast, setShowAllLeast] = useState(false);

  /** Tag a product into the chosen homepage section, then drop the admin
   *  straight into that section so they can position it. Defaults to Best
   *  Sellers. `colors` (when given) records exactly which colourways of the
   *  product should appear — leave it null to keep the current selection. */
  const promote = async (row, section = PROMO_SECTIONS[0], colors = null) => {
    if (!row.productId) return;
    setPromoting(row.productId);
    try {
      const updates = { [section.flag]: true };
      if (colors) updates[section.colorsField] = colors;
      await updateProduct(row.productId, updates);
      navigate(`/admin/sections?section=${section.key}`);
    } catch (e) {
      alert(e?.response?.data?.message || `Couldn't add that to ${section.label}.`);
    } finally {
      setPromoting("");
    }
  };

  /** Jump to a homepage section without changing membership. */
  const goToSection = (section) =>
    navigate(`/admin/sections?section=${section.key}`);

  const recent = [...list]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const stats = [
    { icon: "bag", color: "Blue", value: products.length, label: "Products", sub: `${categories.filter((c) => c !== "All").length} categories` },
    { icon: "box", color: "Green", value: stockUnits, label: "Stock units", sub: "across every variant" },
    { icon: "rupee", color: "Indigo", value: inr(revenue), label: "Revenue", sub: "paid orders", trend: revenueTrend },
    { icon: "alert", color: "Rose", value: outProducts.length + outSizes.length, label: "Out of stock", sub: outProducts.length + outSizes.length ? "needs restocking" : "all good" },
  ];

  return (
    <div className="admin-dashboard">
      {/* header */}
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.name?.split(" ")[0] || "Admin"}!</h1>
          <p className={styles.sub}>Here's what's happening with your store today.</p>
        </div>
        <div className={styles.headActions}>
          <NotificationBell variant="light" />
          <Link to="/admin/products?add=1" className={styles.addBtn}>
            <Icon name="plus" size={16} sw={2.4} />
            Add product
          </Link>
        </div>
      </div>

      {/* stat tiles */}
      <div className={styles.stats}>
        {stats.map((s) => (
          <div
            className={`${styles.stat} ${styles[`statAccent${s.color}`] || ""}`}
            key={s.label}
          >
            <span className={styles.statIcon}>
              <Icon name={s.icon} size={20} />
            </span>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue}>{orders == null && s.label === "Revenue" ? "…" : s.value}</span>
              {s.trend ? (
                <span className={`${styles.statTrend} ${s.trend.up ? styles.trendUp : styles.trendDown}`}>
                  {s.trend.up ? "↑" : "↓"} {Math.abs(s.trend.pct)}% from last week
                </span>
              ) : (
                <span className={styles.statSub}>{s.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* charts row */}
      <div className={styles.grid2}>
        {/* order overview donut */}
        <section className={styles.panel}>
          <div className={styles.panelHeadRow}>
            <h2 className={`${styles.panelTitle} ${styles.panelPurple}`}>Order Overview</h2>
            <Link to="/admin/orders" className={styles.link}>View all →</Link>
          </div>
          {segSum === 0 ? (
            <p className={styles.muted}>No orders yet.</p>
          ) : (
            <div className={styles.donutWrap}>
              <Donut segments={segments} total={list.length} />
              <ul className={styles.legend}>
                {segments.map((seg) => (
                  <li key={seg.key}>
                    <span className={styles.legDot} style={{ background: seg.color }} />
                    <span className={styles.legLabel}>{seg.label}</span>
                    <span className={styles.legVal}>
                      {Math.round((seg.value / segSum) * 100)}% ({seg.value})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* orders last 7 days */}
        <section className={styles.panel}>
          <div className={styles.panelHeadRow}>
            <h2 className={`${styles.panelTitle} ${styles.panelBlue}`}>Orders — last 7 days</h2>
            <span className={styles.muted}>{weekly.reduce((s, d) => s + d.value, 0)} total</span>
          </div>
          <div className={styles.bars}>
            {weekly.map((d) => (
              <div className={styles.barCol} key={d.key}>
                <span className={styles.barNum}>{d.value}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ height: `${(d.value / weeklyMax) * 100}%` }} />
                </div>
                <span className={styles.barDay}>{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* alerts + recent */}
      <div className={styles.grid2}>
        {/* stock alerts */}
        <section className={styles.panel}>
          <div className={styles.panelHeadRow}>
            <h2 className={`${styles.panelTitle} ${styles.panelRose}`}>Stock alerts</h2>
            <Link to="/admin/products" className={styles.link}>Manage →</Link>
          </div>
          {alerts.length === 0 ? (
            <div className={styles.allGood}>
              <span className={styles.allGoodIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              Everything is well stocked.
            </div>
          ) : (
            <>
              <ul className={styles.alertList}>
                {alertsShown.map((a) => (
                  <li className={styles.alertItem} key={a.key}>
                    <span className={a.level === "out" ? styles.alertDotOut : styles.alertDotLow} />
                    <Link to={`/admin/products?edit=${a.id}&tab=inventory`} className={styles.alertText}>
                      {a.text}
                    </Link>
                    <Link
                      to={`/admin/products?edit=${a.id}&tab=inventory`}
                      className={a.level === "out" ? styles.tagOut : styles.tagLow}
                    >
                      {a.tag}
                    </Link>
                  </li>
                ))}
              </ul>
              {alerts.length > alertsShown.length && (
                <Link to="/admin/products" className={styles.moreLink}>
                  + {alerts.length - alertsShown.length} more
                </Link>
              )}
            </>
          )}
        </section>

        {/* recent orders */}
        <section className={styles.panel}>
          <div className={styles.panelHeadRow}>
            <h2 className={`${styles.panelTitle} ${styles.panelTeal}`}>Recent orders</h2>
            <Link to="/admin/orders" className={styles.link}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className={styles.muted}>No orders yet.</p>
          ) : (
            <ul className={styles.recentList}>
              {recent.map((o) => {
                const name = o.shippingAddress?.fullName || o.user?.name || "Customer";
                const color = STATUS_META[o.status]?.color || "#999";
                return (
                  <li className={styles.recentRow} key={o.id || o._id}>
                    <span className={styles.recentAvatar}>{name[0].toUpperCase()}</span>
                    <div className={styles.recentBody}>
                      <span className={styles.recentName}>{name}</span>
                      <span className={styles.recentMeta}>
                        {o.orderNumber || `#${String(o.id || o._id).slice(-6).toUpperCase()}`} · {ago(o.createdAt)}
                      </span>
                    </div>
                    <span className={styles.recentEnd}>
                      <span className={styles.recentAmount}>{inr(o.amounts?.total)}</span>
                      <span className={styles.recentStatus} style={{ color, background: `${color}1a` }}>
                        {STATUS_META[o.status]?.label || o.status}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* top selling */}
      <section className={styles.panel}>
        <div className={styles.panelHeadRow}>
          <h2 className={`${styles.panelTitle} ${styles.panelGreen}`}>Top selling products</h2>
          <span className={styles.muted}>paid, shipped &amp; delivered orders</span>
        </div>
        {topSelling.length === 0 ? (
          <p className={styles.muted}>No sales yet.</p>
        ) : (
          <>
            <div className={styles.sellList}>
              {(showAllTop ? topSelling : topSelling.slice(0, 5)).map((t, i) => (
                <SellRow
                  key={t.key}
                  row={t}
                  rank={i + 1}
                  share={(t.units / topMax) * 100}
                  onPromote={promote}
                  onGoToSection={goToSection}
                  promotingId={promoting}
                />
              ))}
            </div>
            {topSelling.length > 5 && (
              <button
                type="button"
                className={styles.viewMore}
                onClick={() => setShowAllTop((v) => !v)}
              >
                {showAllTop
                  ? "View less"
                  : `View more (${topSelling.length - 5} more)`}
              </button>
            )}
          </>
        )}
      </section>

      {/* least selling */}
      <section className={styles.panel}>
        <div className={styles.panelHeadRow}>
          <h2 className={`${styles.panelTitle} ${styles.panelAmber}`}>Least selling products</h2>
          <span className={styles.muted}>never-sold first</span>
        </div>
        {leastSelling.length === 0 ? (
          <p className={styles.muted}>No products yet.</p>
        ) : (
          <>
            <div className={styles.sellList}>
              {(showAllLeast ? leastSelling : leastSelling.slice(0, 5)).map((t, i) => (
                <SellRow key={t.key} row={t} rank={i + 1} share={0} quiet />
              ))}
            </div>
            {leastSelling.length > 5 && (
              <button
                type="button"
                className={styles.viewMore}
                onClick={() => setShowAllLeast((v) => !v)}
              >
                {showAllLeast
                  ? "View less"
                  : `View more (${leastSelling.length - 5} more)`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/** One product line in the top / least selling panels. */
function SellRow({ row, rank, share, quiet, onPromote, onGoToSection, promotingId }) {
  const busy = promotingId === row.productId;
  const [menuOpen, setMenuOpen] = useState(false);
  const outs = variantOutages(row.product);

  // Section + colourway picker state for the "Add to section" popover.
  const colorNames = (row.product?.colors || []).map((c) => c.name);
  const hasColors = colorNames.length > 0;
  const [selSection, setSelSection] = useState(PROMO_SECTIONS[0]);
  const [selColors, setSelColors] = useState(
    () => row.product?.[PROMO_SECTIONS[0].colorsField] || []
  );
  const allSelected = hasColors && selColors.length === colorNames.length;
  // Switching section reflects that section's currently-chosen colours.
  const chooseSection = (s) => {
    setSelSection(s);
    setSelColors(row.product?.[s.colorsField] || []);
  };
  const toggleColor = (name) =>
    setSelColors((cur) =>
      cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]
    );

  return (
    <div className={`${styles.sellRow} ${quiet ? styles.sellRowQuiet : ""}`}>
      <span className={styles.sellRank}>{rank}</span>

      {row.image ? (
        <img className={styles.sellThumb} src={row.image} alt="" />
      ) : (
        <span className={styles.sellThumbBlank} />
      )}

      <div className={styles.sellMain}>
        <p className={styles.sellName}>
          {row.product?.slug ? (
            <Link
              className={styles.sellNameLink}
              to={`/product/${row.product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row.name}
            </Link>
          ) : (
            row.name
          )}
          {row.featured && <span className={styles.sellTag}>Best seller</span>}
          {row.stock === 0 && <span className={styles.sellTagOut}>Out of stock</span>}
        </p>

        <p className={styles.sellMeta}>
          {row.code && <>{row.code} · </>}
          {row.orders} order{row.orders === 1 ? "" : "s"}
          {row.stock !== null && <> · {row.stock} in stock</>}
          {row.lastSold ? (
            <> · last sold {ago(row.lastSold)}</>
          ) : (
            <> · never sold</>
          )}
        </p>

        {outs.length > 0 && (
          <p className={styles.sellOut}>
            <span className={styles.sellOutDot} />
            Out of stock: {outs.join(", ")}
          </p>
        )}

        {!quiet && (
          <div className={styles.sellBarTrack}>
            <div className={styles.sellBarFill} style={{ width: `${share}%` }} />
          </div>
        )}
      </div>

      <div className={styles.sellNums}>
        <span className={styles.sellUnits}>{row.units} sold</span>
        <span className={styles.sellRevenue}>{inr(row.revenue)}</span>
      </div>

      {onPromote && (
        <div className={styles.promoWrap}>
          {/* Default action stays Best Sellers, one click. */}
          {row.product?.featured ? (
            <button
              type="button"
              className={styles.sellInBtn}
              onClick={() => onGoToSection(PROMO_SECTIONS[0])}
            >
              In Best Sellers
            </button>
          ) : (
            <button
              type="button"
              className={styles.sellAddBtn}
              disabled={busy || !row.productId}
              onClick={() =>
                hasColors
                  ? setMenuOpen(true)
                  : onPromote(row, PROMO_SECTIONS[0])
              }
              title={
                !row.productId
                  ? "This order predates product linking, so it can't be promoted from here"
                  : hasColors
                  ? "Choose which colours to add to a section"
                  : "Add to the Best Sellers section and open it"
              }
            >
              {busy
                ? "Adding…"
                : hasColors
                ? "+ Best Sellers…"
                : "+ Best Sellers"}
            </button>
          )}

          {/* Caret opens the section + colour picker. */}
          <button
            type="button"
            className={styles.promoCaret}
            disabled={busy || !row.productId}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Choose section and colours"
            title="Choose section and colours"
          >
            ▾
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className={styles.promoBackdrop}
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
              />
              <div
                className={styles.promoMenu}
                role="dialog"
                aria-label="Add to a homepage section"
              >
                <p className={styles.promoMenuTitle}>Add to section</p>
                <div className={styles.promoSecRow}>
                  {PROMO_SECTIONS.map((s) => {
                    const inSection = !!row.product?.[s.flag];
                    return (
                      <button
                        key={s.key}
                        type="button"
                        className={`${styles.promoSec} ${
                          selSection.key === s.key ? styles.promoSecOn : ""
                        }`}
                        onClick={() => chooseSection(s)}
                      >
                        {s.label}
                        {inSection && <span className={styles.promoSecTick}>✓</span>}
                      </button>
                    );
                  })}
                </div>

                {hasColors && (
                  <>
                    <p className={styles.promoSubTitle}>Colours to show</p>
                    <div className={styles.promoChips}>
                      <button
                        type="button"
                        className={`${styles.promoChip} ${
                          allSelected ? styles.promoChipOn : ""
                        }`}
                        onClick={() =>
                          setSelColors(allSelected ? [] : [...colorNames])
                        }
                      >
                        All colours
                      </button>
                      {colorNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={`${styles.promoChip} ${
                            selColors.includes(name) ? styles.promoChipOn : ""
                          }`}
                          onClick={() => toggleColor(name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    <p className={styles.promoHint}>
                      {selColors.length === 0
                        ? "None picked — the primary colour shows."
                        : `${selColors.length} colour${
                            selColors.length === 1 ? "" : "s"
                          } will show as ${
                            selColors.length === 1
                              ? "its own card"
                              : "separate cards"
                          }.`}
                    </p>
                  </>
                )}

                <button
                  type="button"
                  className={styles.promoAdd}
                  disabled={busy || !row.productId}
                  onClick={() => {
                    setMenuOpen(false);
                    onPromote(row, selSection, hasColors ? selColors : null);
                  }}
                >
                  {busy ? "Adding…" : `Add to ${selSection.label}`}
                </button>

                {!!row.product?.[selSection.flag] && (
                  <button
                    type="button"
                    className={styles.promoGoto}
                    onClick={() => {
                      setMenuOpen(false);
                      onGoToSection(selSection);
                    }}
                  >
                    Open {selSection.label} →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
