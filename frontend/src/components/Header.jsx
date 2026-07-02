import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Header.module.css";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    label: "Shop",
    path: "/shop",
  },
  {
    label: "New Arrivals",
    path: "/shop",
  },
  {
    label: "Best Sellers",
    path: "/shop",
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={`${styles.row} shell`}>
        <button
          className={styles.icon}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`${styles.burger} ${open ? styles.burgerOpen : ""}`} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>

        <Link to="/" className={styles.brand} aria-label="Appealing Apparels home">
          <span className={styles.brandWord}>Appealing</span>
          <span className={styles.brandWord}>Apparels</span>
        </Link>

        <nav className={styles.deskNav} aria-label="Primary">
  {NAV.map((item) => (
    <Link
      key={item.label}
      to={item.path}
      className={styles.deskLink}
    >
      {item.label}
    </Link>
  ))}
</nav>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <button className={styles.iconText} onClick={logout} aria-label="Log out">Logout</button>
          ) : (
            <Link to="/login" className={styles.iconText}>Login</Link>
          )}
          {isAdmin && <Link to="/admin" className={styles.iconText}>Admin</Link>}
          <Link to="/shop" className={styles.iconText} aria-label="Search">Search</Link>
          <Link to="/wishlist" className={styles.iconText} aria-label={`Saved items, ${wishlist.length}`}>Saved ({wishlist.length})</Link>
          <Link
  to="/cart"
  className={styles.bag}
  aria-label={`Shopping bag, ${cart.length} items`}
>
  Bag <span className={styles.bagCount}>{cart.length}</span>
</Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        aria-hidden={!open}
      >
        <nav className={styles.drawerNav} aria-label="Mobile">
          {NAV.map((item, i) => (
            <Link
              key={item.label}
              to={item.path}
              className={styles.drawerLink}
              style={{ transitionDelay: open ? `${0.08 + i * 0.05}s` : "0s" }}
              onClick={() => setOpen(false)}
            >
              <span className={styles.drawerIndex}>{String(i + 1).padStart(2, "0")}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.drawerFoot}>
          <Link to="/wishlist" onClick={() => setOpen(false)}>Wishlist ({wishlist.length})</Link>
          {isAuthenticated ? (
            <>
              <span style={{ color: "var(--ink-faint)" }}>Hi, {user?.name?.split(" ")[0]}</span>
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)}>Admin dashboard</Link>}
              <button style={{ textAlign: "left" }} onClick={() => { logout(); setOpen(false); }}>Log out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
          )}
          <a href="#">Store locator</a>
          <a href="#">Help</a>
        </div>
      </div>
      {open && <button className={styles.scrim} aria-label="Close menu" onClick={() => setOpen(false)} />}
    </header>
  );
}
