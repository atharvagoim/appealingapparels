import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import useAdminNotifications from "./useAdminNotifications.jsx";
import styles from "./NotificationBell.module.css";

const PANEL_WIDTH = 320;
const MARGIN = 12;
const PANEL_MAX_HEIGHT = 420;

/**
 * The one notification bell used everywhere in admin — the sidebar/drawer
 * footer and the Dashboard header both render this same component, backed
 * by the same polling hook, so "new order" etc. shows up identically no
 * matter which bell you click.
 *
 * The dropdown is rendered through a portal straight into document.body,
 * positioned from the button's actual on-screen coordinates — not CSS
 * position:absolute nested inside the button. That matters here because
 * both the sidebar and drawer have overflow:hidden (needed for their own
 * scroll behaviour), which would otherwise clip the dropdown entirely: it
 * would toggle open in state but never actually be visible. The position is
 * also clamped to the viewport and picks whichever side (up/down) actually
 * has room, so it can't render half off-screen the way a fixed "always
 * open upward" position could for a bell near the top of the page.
 */
export default function NotificationBell({ variant = "light" }) {
  const { events, unreadCount, markAllSeen } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);

  const openPanel = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.max(
        MARGIN,
        Math.min(rect.left, window.innerWidth - PANEL_WIDTH - MARGIN)
      );
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openDownward = spaceBelow >= PANEL_MAX_HEIGHT || spaceBelow >= spaceAbove;
      setPos(
        openDownward
          ? { top: rect.bottom + 8, left }
          : { bottom: window.innerHeight - rect.top + 8, left }
      );
    }
    setOpen(true);
    markAllSeen();
  };

  return (
    <div className={styles.wrap}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.btn} ${variant === "dark" ? styles.btnDark : styles.btnLight}`}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <>
            <button className={styles.scrim} aria-label="Close notifications" onClick={() => setOpen(false)} />
            <div className={styles.panel} style={{ position: "fixed", ...pos }}>
              <div className={styles.panelHead}>Notifications</div>
              {events.length === 0 ? (
                <p className={styles.empty}>
                  Nothing new yet — new orders, support messages, and reviews will show up here.
                </p>
              ) : (
                <ul className={styles.list}>
                  {events.map((e) => (
                    <li key={`${e.type}:${e.id}`}>
                      <Link to={e.link} className={styles.item} onClick={() => setOpen(false)}>
                        <span className={`${styles.dot} ${styles["dot_" + e.type]}`} aria-hidden="true" />
                        <span className={styles.itemBody}>
                          <span className={styles.itemMsg}>{e.message}</span>
                          {e.sub && <span className={styles.itemSub}>{e.sub}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
