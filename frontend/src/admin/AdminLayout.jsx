import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import styles from "./AdminLayout.module.css";

const NAV = [
  { label: "Dashboard", path: "/admin", end: true },
  { label: "Products", path: "/admin/products" },
  { label: "Cover Images", path: "/admin/cover" },
  { label: "Categories", path: "/admin/categories" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Customers", path: "/admin/customers" },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className={styles.shell}>
      {/* Sidebar (desktop) */}
      <aside className={styles.sidebar}>
        <Link to="/admin" className={styles.brand}>
          <span className={styles.brandMark}>AA</span>
          <span className={styles.brandText}>Admin</span>
        </Link>
        {nav}
        <Link to="/" className={styles.exit}>
          ← View store
        </Link>
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
          <span className={styles.brandText}>Admin</span>
          <button
            className={styles.close}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        {nav}
        <Link to="/" className={styles.exit}>
          ← View store
        </Link>
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
