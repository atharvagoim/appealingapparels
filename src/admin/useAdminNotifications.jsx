import { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchRecentEvents } from "../api/notificationsApi";

const POLL_MS = 20000;
const MAX_KEPT = 30;
const LAST_SEEN_KEY = "aa_admin_notifications_last_seen";

const NotificationsContext = createContext(null);

/**
 * Wraps the whole admin panel once (in AdminLayout) so every bell — the
 * sidebar one and the Dashboard header one — shares a single poll loop and
 * a single list of events, instead of each mounting its own independent
 * useAdminNotifications and polling separately. Two bells polling
 * independently doubled the request rate on the Dashboard page and could
 * show two different unread counts, since marking one "seen" had no way to
 * update the other's local state.
 */
export function NotificationsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(
    () => localStorage.getItem(LAST_SEEN_KEY) || new Date(0).toISOString()
  );
  const sinceRef = useRef(null);
  const seenIds = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchRecentEvents(sinceRef.current);
        if (cancelled) return;
        sinceRef.current = data.now;

        const fresh = (data.events || []).filter((e) => {
          const key = `${e.type}:${e.id}`;
          if (seenIds.current.has(key)) return false;
          seenIds.current.add(key);
          return true;
        });
        if (fresh.length) {
          setEvents((prev) => [...fresh, ...prev].slice(0, MAX_KEPT));
        }
      } catch {
        // A failed poll just tries again next interval — notifications are
        // a nice-to-have, not worth surfacing an error banner over.
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const unreadCount = events.filter((e) => e.at > lastSeenAt).length;

  const markAllSeen = () => {
    const now = new Date().toISOString();
    setLastSeenAt(now);
    localStorage.setItem(LAST_SEEN_KEY, now);
  };

  return (
    <NotificationsContext.Provider value={{ events, unreadCount, markAllSeen }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export default function useAdminNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useAdminNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
