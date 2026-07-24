import { useEffect, useRef, useState } from "react";
import styles from "./ShareMenu.module.css";

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.4.4 0 0 0 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.5 11.1 11.1 0 0 0 4.3 3.8c1.6.6 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 15l6-6" />
    <path d="M11 6.5 12.4 5a4 4 0 1 1 5.6 5.6L16.5 12" />
    <path d="M13 17.5 11.6 19a4 4 0 1 1-5.6-5.6L7.5 12" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/**
 * Share this product — WhatsApp, Instagram, Facebook or a plain copied link.
 *
 * Instagram has no public web share URL for an arbitrary link, so that option
 * copies the link and opens Instagram, ready to paste into a story or DM.
 */
export default function ShareMenu({ title, url }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const message = `${title} — ${shareUrl}`;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      return true;
    } catch {
      return false;
    }
  };

  const openTab = (href) => window.open(href, "_blank", "noopener,noreferrer");

  const options = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      className: styles.whatsapp,
      onClick: () => {
        openTab(`https://wa.me/?text=${encodeURIComponent(message)}`);
        setOpen(false);
      },
    },
    {
      key: "instagram",
      label: "Instagram",
      hint: "Copies the link to paste",
      icon: <InstagramIcon />,
      className: styles.instagram,
      onClick: async () => {
        await copy();
        openTab("https://www.instagram.com/");
        setOpen(false);
      },
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: <FacebookIcon />,
      className: styles.facebook,
      onClick: () => {
        openTab(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        );
        setOpen(false);
      },
    },
    {
      key: "copy",
      label: copied ? "Link copied" : "Copy link",
      icon: copied ? <CheckIcon /> : <LinkIcon />,
      className: copied ? styles.copied : styles.copy,
      onClick: copy,
    },
  ];

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOn : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Share this product"
        title="Share"
      >
        <ShareIcon />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuTitle}>Share this product</p>

          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={o.onClick}
            >
              <span className={`${styles.itemIcon} ${o.className}`}>{o.icon}</span>
              <span className={styles.itemText}>
                <span className={styles.itemLabel}>{o.label}</span>
                {o.hint && <span className={styles.itemHint}>{o.hint}</span>}
              </span>
            </button>
          ))}

          <p className={styles.url}>{shareUrl}</p>
        </div>
      )}
    </div>
  );
}
