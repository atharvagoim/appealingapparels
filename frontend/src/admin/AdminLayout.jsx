import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminLayout.module.css";

const icon = (paths) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const ICONS = {
  "/admin": icon(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  "/admin/products": icon(<><path d="M6 7h12l1 13H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></>),
  "/admin/sections": icon(<><rect x="3" y="4" width="7" height="16" rx="1.5" /><rect x="12" y="4" width="9" height="7" rx="1.5" /><rect x="12" y="13" width="9" height="7" rx="1.5" /></>),
  "/admin/cover": icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5-5L5 20" /></>),
  "/admin/categories": icon(<><path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3.2H4v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8z" /><circle cx="7.7" cy="7.7" r="1.2" /></>),
  "/admin/store": icon(<><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.2" /></>),
  "/admin/social": icon(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4" /></>),
  "/admin/footer": icon(<><path d="M4 17h16M4 12h16M4 7h16" /><circle cx="18" cy="17" r="2.6" /></>),
  "/admin/size-chart": icon(<><path d="M3 8 8 3l13 13-5 5z" /><path d="m8.5 7.5 1.5 1.5M11.5 10.5l1.5 1.5M14.5 13.5l1.5 1.5" /></>),
  "/admin/orders": icon(<><path d="M12 3l8 4v10l-8 4-8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></>),
  "/admin/customers": icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M15 15.7a5.5 5.5 0 0 1 5 4.3" /></>),
  "/admin/support": icon(<><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 0 1-4 3h-2" /></>),
  "/admin/reviews": icon(<path d="M12 2.9l2.75 5.6 6.15.9-4.45 4.35 1.05 6.15L12 16.98l-5.5 2.92 1.05-6.15L3.1 9.4l6.15-.9z" />),
  "/admin/coupons": icon(<><path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 3v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-3z" /><path d="M9 8v9" strokeDasharray="2 2" /></>),
};

const NAV = [
  { label: "Dashboard", path: "/admin", end: true },
  { label: "Products", path: "/admin/products" },
  { label: "Sections", path: "/admin/sections" },
  { label: "Cover", path: "/admin/cover" },
  { label: "Categories", path: "/admin/categories" },
  { label: "Store", path: "/admin/store" },
  { label: "Social", path: "/admin/social" },
  { label: "Footer", path: "/admin/footer" },
  { label: "Size Chart", path: "/admin/size-chart" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Customers", path: "/admin/customers" },
  { label: "Reviews", path: "/admin/reviews" },
  { label: "Coupons", path: "/admin/coupons" },
  { label: "Support", path: "/admin/support" },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // The nav scrolls now, so an item near the bottom of the list can be active
  // yet out of sight. Bring it into view on navigation and when the mobile
  // drawer opens. Hidden copies simply ignore this.
  useEffect(() => {
    document
      .querySelectorAll(`.${styles.navActive}`)
      .forEach((el) => el.scrollIntoView({ block: "nearest" }));
  }, [pathname, open]);

  const name = user?.name || "Admin";
  const email = user?.email || "";
  const avatarLetter = (name[0] || "A").toUpperCase();

  const brand = (
    <Link to="/admin" className={styles.brand}>
      <span className={styles.brandMark}>AA</span>
      <span className={styles.brandText}>
        <span className={styles.brandTop}>Admin Panel</span>
        <span className={styles.brandSub}>Appealing Apparels</span>
      </span>
    </Link>
  );

  const nav = (
    <nav className={styles.nav} aria-label="Admin">
      {NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.navActive : ""}`
          }
        >
          <span className={styles.navIcon}>{ICONS[item.path]}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className={styles.sideFoot}>
      <Link to="/" className={styles.viewStore}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 4h6v6" />
          <path d="M20 4 10 14" />
          <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
        </svg>
        View store
      </Link>
      <div className={styles.userCard}>
        <span className={styles.avatar}>{avatarLetter}</span>
        <span className={styles.userMeta}>
          <span className={styles.userName}>{name}</span>
          {email && <span className={styles.userEmail}>{email}</span>}
        </span>
        <svg className={styles.userChev} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className={styles.shell}>
      {/* Sidebar (desktop) */}
      <aside className={styles.sidebar}>
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className={styles.topbar}>
        <button
          className={styles.menuBtn}
          aria-label="Open admin menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link to="/admin" className={styles.topBrand}>
          Appealing Apparels · Admin
        </Link>
      </header>

      {/* Mobile drawer */}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHead}>
          {brand}
          <button
            className={styles.close}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        {nav}
        {footer}
      </div>
      {open && (
        <button
          className={styles.scrim}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Routed page */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
