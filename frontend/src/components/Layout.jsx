import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

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
 * App shell shared by every route. Each page renders its own <main>
 * landmark, so the layout only owns the persistent chrome.
 */
export default function Layout() {
  return (
    <>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
