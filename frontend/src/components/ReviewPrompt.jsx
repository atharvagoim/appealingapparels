import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchReviewPrompt, markPromptSeenApi } from "../api/reviewsApi";
import ReviewDialog from "./ReviewDialog";

/**
 * Asks a customer to rate an order once it's been delivered — shown on the
 * homepage and only ever once per order.
 *
 * "Once" is enforced on the server: the moment we decide to show the popup we
 * stamp the order as prompted, before the customer touches anything. Closing
 * it, ignoring it, reloading, or opening the site on another device all leave
 * it retired. Writing the review is entirely optional.
 */
export default function ReviewPrompt() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    if (!user) {
      setPrompt(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const next = await fetchReviewPrompt();
        if (!active || !next?.orderId) return;

        // Burn it first — whatever happens next, it won't come back.
        await markPromptSeenApi(next.orderId);
        if (active) setPrompt(next);
      } catch {
        /* never let this get in the way of browsing */
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  if (!prompt) return null;

  return (
    <ReviewDialog
      order={prompt}
      title="How did we do?"
      subtitle={`Your order ${
        prompt.orderNumber || ""
      } has arrived. If you have a moment, rate what you bought — only if you'd like to.`}
      onClose={() => setPrompt(null)}
    />
  );
}
