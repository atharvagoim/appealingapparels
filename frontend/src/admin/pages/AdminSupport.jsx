import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchThreads,
  fetchThread,
  replyToThread,
  setThreadStatusApi,
  deleteThreadApi,
} from "../../api/supportApi";
import ui from "../admin.module.css";
import styles from "./AdminSupport.module.css";

const PAGE_SIZE = 5;

const fmtFull = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const fmtShort = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const AVATARS = ["a", "b", "c", "d", "e"];
const avatarTone = (name) => AVATARS[(name || "?").charCodeAt(0) % AVATARS.length];

/* row status → label + colour */
function rowStatus(t) {
  if (t.status === "closed") return { key: "closed", label: "Closed" };
  if (t.unread > 0) return { key: "new", label: "New" };
  return { key: "open", label: "Open" };
}

const Icon = ({ name, size = 18, sw = 1.8 }) => {
  const p = {
    refresh: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 7h11" />
        <circle cx="18" cy="7" r="2.2" />
        <path d="M20 17H9" />
        <circle cx="6" cy="17" r="2.2" />
      </>
    ),
    sort: (
      <>
        <path d="M7 4v16M4 8l3-4 3 4" />
        <path d="M17 20V4M14 16l3 4 3-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </>
    ),
    chevL: <path d="M15 6l-6 6 6 6" />,
    chevR: <path d="M9 6l6 6-6 6" />,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[name]}
    </svg>
  );
};

export default function AdminSupport() {
  const [threads, setThreads] = useState([]);
  const [openId, setOpenId] = useState("");
  const [thread, setThread] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [tab, setTab] = useState("all"); // all | new | open | closed
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);

  const endRef = useRef(null);

  const loadList = () =>
    fetchThreads()
      .then(setThreads)
      .catch(() => setErr("Couldn't load conversations."));

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!openId) {
      setThread(null);
      return;
    }
    fetchThread(openId)
      .then(setThread)
      .catch(() => setErr("Couldn't open that conversation."));
  }, [openId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages?.length]);

  useEffect(() => setPage(1), [tab, q, dateFilter]);

  const counts = useMemo(
    () => ({
      all: threads.length,
      new: threads.filter((t) => t.unread > 0).length,
      open: threads.filter((t) => t.status === "open").length,
      closed: threads.filter((t) => t.status === "closed").length,
    }),
    [threads]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const inRange = (d) => {
      if (dateFilter === "all") return true;
      const diff = now - new Date(d).getTime();
      if (dateFilter === "today") return diff < day;
      if (dateFilter === "7") return diff < 7 * day;
      if (dateFilter === "30") return diff < 30 * day;
      return true;
    };
    const needle = q.trim().toLowerCase();
    let list = threads.filter((t) => {
      if (tab === "new" && !(t.unread > 0)) return false;
      if (tab === "open" && t.status !== "open") return false;
      if (tab === "closed" && t.status !== "closed") return false;
      if (!inRange(t.lastMessageAt)) return false;
      if (needle) {
        const hay = [t.user?.name, t.user?.email, t.subject, t.orderNumber, t.lastMessage?.body]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    list = list.sort((a, b) => {
      const d = new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      return sortDesc ? d : -d;
    });
    return list;
  }, [threads, tab, q, dateFilter, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !openId) return;
    setBusy(true);
    setErr("");
    try {
      const updated = await replyToThread(openId, text.trim());
      setThread(updated);
      setText("");
      loadList();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Couldn't send that reply.");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    if (!thread) return;
    const next = thread.status === "open" ? "closed" : "open";
    try {
      await setThreadStatusApi(thread.id, next);
      setThread({ ...thread, status: next });
      loadList();
    } catch {
      setErr("Couldn't change the status.");
    }
  };

  /** Remove a conversation from the inbox permanently. */
  const removeThreadById = async (id, who = "this customer") => {
    if (
      !window.confirm(
        `Delete this conversation with ${who}?\n\nEvery message in it will be removed and this can't be undone.`
      )
    )
      return;

    setDeleting(true);
    try {
      await deleteThreadApi(id);
      if (openId === id) {
        setThread(null);
        setOpenId("");
      }
      loadList();
    } catch (e) {
      setErr(e?.response?.data?.message || "Couldn't delete that conversation.");
    } finally {
      setDeleting(false);
    }
  };

  const removeThread = () =>
    thread && removeThreadById(thread.id, thread.user?.name || "this customer");

  const refresh = () => {
    loadList();
    if (openId) fetchThread(openId).then(setThread).catch(() => {});
  };

  const TABS = [
    { key: "all", label: "All", tone: "ink" },
    { key: "new", label: "New", tone: "blue" },
    { key: "open", label: "Open", tone: "amber" },
    { key: "closed", label: "Closed", tone: "green" },
  ];

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Support</h1>
          <p className={ui.pageSub}>
            Questions from customers. Replies appear in their account instantly.
          </p>
        </div>
        <div className={ui.headActions}>
          <button className={`${ui.btn} ${ui.btnGhost}`} onClick={refresh}>
            <Icon name="refresh" size={16} sw={2} />
            Refresh
          </button>
          <button
            className={ui.btn}
            onClick={() =>
              alert("Conversations are started by customers from their account — there's nothing to create here.")
            }
          >
            <Icon name="plus" size={16} sw={2.4} />
            New conversation
          </button>
        </div>
      </div>

      {err && <p className={styles.error}>{err}</p>}

      {/* status tabs */}
      <div className={styles.tabs}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            className={`${styles.tab} ${tab === tb.key ? styles.tabOn : ""}`}
            onClick={() => setTab(tb.key)}
          >
            {tb.key !== "all" && <span className={`${styles.dot} ${styles["dot_" + tb.tone]}`} />}
            {tb.label} ({counts[tb.key]})
          </button>
        ))}
      </div>

      {/* filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <Icon name="search" size={20} sw={2} />
          </span>
          <input
            className={styles.search}
            placeholder="Search by name, email, message…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <label className={styles.selectField}>
          <span className={styles.selectLabel}>Status</span>
          <select className={styles.select} value={tab} onChange={(e) => setTab(e.target.value)}>
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.selectLabel}>Date</span>
          <select
            className={styles.select}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
        <button
          className={styles.moreBtn}
          onClick={() => {
            setQ("");
            setTab("all");
            setDateFilter("all");
          }}
          title="Clear all filters"
        >
          <Icon name="sliders" size={18} />
          More filters
        </button>
      </div>

      <div className={styles.wrap}>
        {/* inbox */}
        <div className={styles.listCard}>
          <div className={styles.listHead}>
            <span className={styles.listTitle}>Conversations ({filtered.length})</span>
            <button className={styles.sortBtn} onClick={() => setSortDesc((s) => !s)}>
              {sortDesc ? "Newest first" : "Oldest first"}
              <Icon name="sort" size={15} sw={1.7} />
            </button>
          </div>

          <div className={styles.rows}>
            {pageItems.length === 0 ? (
              <p className={styles.muted}>No conversations match.</p>
            ) : (
              pageItems.map((t) => {
                const rs = rowStatus(t);
                const name = t.user?.name || "Customer";
                return (
                  <div className={styles.rowWrap} key={t.id}>
                  <button
                    className={`${styles.row} ${openId === t.id ? styles.rowOn : ""}`}
                    onClick={() => setOpenId(t.id)}
                  >
                    <span className={`${styles.avatar} ${styles["av_" + avatarTone(name)]}`}>
                      {name[0].toUpperCase()}
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.rowTop}>
                        <span className={styles.who}>{name}</span>
                        <span className={`${styles.pill} ${styles["pill_" + rs.key]}`}>
                          {rs.label}
                        </span>
                      </span>
                      {t.subject && (
                        <span className={styles.subject}>{t.subject}</span>
                      )}
                      <span className={styles.preview}>
                        {t.lastMessage
                          ? `${t.lastMessage.from === "admin" ? "You: " : ""}${t.lastMessage.body}`
                          : "No messages yet"}
                      </span>
                      <span className={styles.when}>
                        <Icon name="calendar" size={14} sw={1.7} />
                        {fmtFull(t.lastMessageAt)}
                      </span>
                    </span>
                  </button>

                  <button
                    className={styles.rowDelete}
                    onClick={() => removeThreadById(t.id, name)}
                    aria-label={`Delete conversation with ${name}`}
                    title="Delete conversation"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
                      <path d="M10 11.5v6M14 11.5v6" />
                    </svg>
                  </button>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.listFoot}>
            <span className={styles.muted}>
              {filtered.length === 0
                ? "Showing 0 of 0"
                : `Showing ${start + 1} to ${start + pageItems.length} of ${filtered.length}`}
            </span>
            <div className={styles.pager}>
              <button
                className={styles.pageArrow}
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
              >
                <Icon name="chevL" size={16} sw={2} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`${styles.pageNum} ${n === safePage ? styles.pageOn : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className={styles.pageArrow}
                disabled={safePage === totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
              >
                <Icon name="chevR" size={16} sw={2} />
              </button>
            </div>
          </div>
        </div>

        {/* conversation */}
        <div className={styles.pane}>
          {!thread ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3z" />
                  <path d="M18 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1l-3 3v-3" />
                </svg>
              </span>
              <p className={styles.emptyTitle}>No conversation selected</p>
              <p className={styles.emptySub}>Select a conversation from the list to read and reply.</p>
            </div>
          ) : (
            <>
              <div className={styles.paneHead}>
                <div className={styles.paneWho}>
                  <span className={`${styles.avatar} ${styles["av_" + avatarTone(thread.user?.name)]}`}>
                    {(thread.user?.name || "C")[0].toUpperCase()}
                  </span>
                  <div>
                    <p className={styles.who}>
                      {thread.user?.name}
                      {thread.subject && (
                        <span className={styles.subject}> · {thread.subject}</span>
                      )}
                    </p>
                    <p className={styles.muted}>
                      {thread.user?.email}
                      {thread.user?.phone ? ` · ${thread.user.phone}` : ""}
                    </p>
                  </div>
                </div>
                <div className={styles.paneActions}>
                  <button className={`${ui.btn} ${ui.btnGhost}`} onClick={toggleStatus}>
                    {thread.status === "open" ? "Mark resolved" : "Reopen"}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={removeThread}
                    disabled={deleting}
                    title="Delete this conversation"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>

              <div className={styles.chat}>
                {thread.messages.length === 0 && (
                  <p className={styles.muted}>No messages yet — say hello.</p>
                )}
                {thread.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`${styles.bubble} ${m.from === "admin" ? styles.mine : styles.theirs}`}
                  >
                    <p>{m.body}</p>
                    <span className={styles.bubbleMeta}>
                      {m.from === "admin" ? "You" : thread.user?.name || "Customer"} · {fmtShort(m.createdAt)}
                    </span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form className={styles.replyForm} onSubmit={send}>
                <input
                  className={styles.input}
                  placeholder="Write a reply…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button className={ui.btn} type="submit" disabled={busy || !text.trim()}>
                  {busy ? "Sending…" : "Reply"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
