import { useEffect } from "react";

const SITE_NAME = "Appealing Apparels";
const DEFAULT_DESCRIPTION =
  "Appealing Apparels — spacious, durable bags designed to go everywhere. Totes, slings, hobo bags and more, built for daily carry.";

/**
 * Sets document.title and the meta-description tag for the current page,
 * then restores the site defaults on unmount so navigating away never leaves
 * a stale title/description behind on the next page.
 *
 * Search engines that render JavaScript (Google's crawler does) pick this
 * up. Link-preview bots that DON'T run JS — WhatsApp, Facebook, Twitter,
 * iMessage — only ever see the static Open Graph tags baked into
 * index.html, so this hook is for the browser tab, bookmarks, and Google's
 * own listing, not for social share cards.
 *
 * @param {string} title - Page-specific title. SITE_NAME is appended
 *   automatically unless `bare` is set.
 * @param {string} [description] - Falls back to the site default when
 *   omitted, so a page never ships with no description at all.
 */
export default function useDocumentMeta(title, description, { bare = false } = {}) {
  useEffect(() => {
    const fullTitle = bare || !title ? title || SITE_NAME : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;

    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    const previousContent = tag.getAttribute("content");
    tag.setAttribute("content", description || DEFAULT_DESCRIPTION);

    return () => {
      document.title = `${SITE_NAME} — Bags Designed To Go Everywhere`;
      if (tag) tag.setAttribute("content", previousContent ?? DEFAULT_DESCRIPTION);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, bare]);
}
