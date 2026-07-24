import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Header.module.css";
import mobileLogo from "../assets/logo-mobile-text.png";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const NAV = [
  {
    label: "Shop",
    path: "/shop",
  },
  {
    label: "New Arrivals",
    path: "/shop?category=New%20Arrivals",
  },
  {
    label: "Best Sellers",
    path: "/shop?category=Best%20Sellers",
  },
];

export default function Header({ onMenuOpenChange }) {
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [drawerCatsOpen, setDrawerCatsOpen] = useState(false);
  const [drawerCatOpen, setDrawerCatOpen] = useState(false);
  const catRef = useRef(null);
  const { categories } = useProducts();

  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { storeInfo } = useSettings();

  /** Whatever the shop has set in admin — a maps link, or a search for it. */
  const storeLink =
    String(storeInfo?.mapsUrl || "").trim() ||
    (storeInfo?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          storeInfo.address
        )}`
      : "");

  const goToHelp = (e) => {
    e.preventDefault();
    setOpen(false);
    // Wait for the drawer to release the body scroll lock before jumping.
    setTimeout(() => {
      document
        .getElementById("footer-help")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };
  const { isAuthenticated, isAdmin, user } = useAuth();
  useEffect(() => {
    if (!open) setDrawerCatsOpen(false);
  }, [open]);

  // Let the shared sticky wrapper know the drawer is open, so it doesn't
  // hide the header out from under an open menu while scrolling.
  useEffect(() => {
    onMenuOpenChange?.(open);
  }, [open, onMenuOpenChange]);

  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setCatOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

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
            <i />
          </span>
        </button>

        <Link to="/" className={styles.brand} aria-label="Appealing Apparels home">
          <img
            src={mobileLogo}
            alt="Appealing Apparels"
            className={styles.brandMobileLogo}
          />
          <span className={styles.brandText}>
            <span className={styles.brandWord}>Appealing</span>
            <span className={styles.brandWord}>Apparels</span>
          </span>
        </Link>

        <nav className={styles.deskNav} aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.label} to={item.path} className={styles.deskLink}>
              {item.label}
            </Link>
          ))}

          {categories.length > 0 && (
            <div
              className={styles.catWrap}
              ref={catRef}
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                type="button"
                className={styles.deskLink}
                aria-expanded={catOpen}
                aria-haspopup="true"
                onClick={() => setCatOpen((o) => !o)}
              >
                Categories
                <svg
                  className={catOpen ? `${styles.caret} ${styles.caretOpen}` : styles.caret}
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {catOpen && (
                <div className={styles.catMenu} role="menu">
                  {categories.map((c) => (
                    <Link
                      key={c}
                      to={`/shop?category=${encodeURIComponent(c)}`}
                      className={styles.catItem}
                      role="menuitem"
                      onClick={() => setCatOpen(false)}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className={styles.actions}>
          {!isAuthenticated && (
            <Link to="/login" className={styles.iconText}>Login</Link>
          )}
          {isAdmin && <Link to="/admin" className={styles.iconText}>Admin</Link>}

          {/* search */}
          <Link to="/shop" className={styles.iconAction} aria-label="Search">
            <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <line x1="15.4" y1="15.4" x2="20.5" y2="20.5" strokeWidth="2.6" />
            </svg>
          </Link>

          {/* saved / wishlist */}
          <Link to="/wishlist" className={styles.iconAction} aria-label={`Saved items, ${wishlist.length}`}>
            <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21.2 3.9 12.6a5.1 5.1 0 0 1 .3-7.2 5.1 5.1 0 0 1 7.2.3l.6.7.6-.7a5.1 5.1 0 0 1 7.2-.3 5.1 5.1 0 0 1 .3 7.2L12 21.2z" />
            </svg>
          </Link>

          {/* account / user */}
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            className={styles.iconAction}
            aria-label="Account"
          >
            <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="7.5" r="4" />
              <path d="M4.5 20.5v-1a7.5 7.5 0 0 1 15 0v1H4.5z" />
            </svg>
          </Link>

          {/* bag + count badge */}
          <Link
            to="/cart"
            className={styles.bag}
            aria-label={`Shopping bag, ${cart.length} items`}
          >
            <svg
              className={styles.actionIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5.4 8h13.2l1 12.2H4.4L5.4 8z" />
              <path d="M8.6 12.4V7.4a2.9 2.9 0 0 1 5.8 0" />
            </svg>
            <span className={styles.bagBadge}>{cart.length}</span>
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        aria-hidden={!open}
      >
        <button
          className={styles.drawerClose}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
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

          {categories.length > 0 && (
            <div className={styles.drawerCats}>
              <button
                type="button"
                className={styles.drawerCatsToggle}
                aria-expanded={drawerCatOpen}
                onClick={() => setDrawerCatOpen((o) => !o)}
              >
                <span className={styles.drawerIndex}>
                  {String(NAV.length + 1).padStart(2, "0")}
                </span>
                Categories
                <svg
                  className={
                    drawerCatOpen
                      ? `${styles.caret} ${styles.caretOpen}`
                      : styles.caret
                  }
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {drawerCatOpen && (
                <div className={styles.drawerCatList}>
                  {categories.map((c) => (
                    <Link
                      key={c}
                      to={`/shop?category=${encodeURIComponent(c)}`}
                      className={styles.drawerCatLink}
                      onClick={() => {
                        setOpen(false);
                        setDrawerCatOpen(false);
                      }}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
        <div className={styles.drawerFoot}>
          {isAuthenticated ? (
            <>
              <span className={styles.drawerGreeting}>
                Hi, {user?.name?.split(" ")[0]}
              </span>
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)}>
                  Admin dashboard
                </Link>
              )}
              <Link to="/account" onClick={() => setOpen(false)}>
                My account
              </Link>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}

          <Link to="/account?tab=Orders" onClick={() => setOpen(false)}>
            Track order
          </Link>

          {storeLink && (
            <a href={storeLink} target="_blank" rel="noopener noreferrer">
              Store locator
            </a>
          )}

          <a href="/#footer-help" onClick={goToHelp}>
            Help
          </a>
        </div>
      </div>
      {open && <button className={styles.scrim} aria-label="Close menu" onClick={() => setOpen(false)} />}
    </header>
  );
}
