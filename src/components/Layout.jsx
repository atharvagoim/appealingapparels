import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import WhatsAppButton from "./WhatsAppButton.jsx";
import useScrollHidden from "../hooks/useScrollHidden";
import styles from "./Layout.module.css";

/**
 * Resets scroll position on every route change. React Router v7's
 * createBrowserRouter does not do this automatically.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/**
 * Announcement bar + header live in one sticky wrapper so they hide/reveal
 * together as a single unit on scroll (mobile only) — no fragile height
 * math between two independently-positioned elements.
 */
function TopBar({ isHome }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hidden = useScrollHidden(80, menuOpen);
  return (
    <div className={`${styles.topBar} ${hidden ? styles.topBarHidden : ""}`}>
      {isHome && <AnnouncementBar />}
      <Header onMenuOpenChange={setMenuOpen} />
    </div>
  );
}

/**
 * App shell shared by every route. Each page renders its own <main>
 * landmark, so the layout only owns the persistent chrome.
 */
export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <>
      <ScrollToTop />
      <TopBar isHome={isHome} />
      <Outlet />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
