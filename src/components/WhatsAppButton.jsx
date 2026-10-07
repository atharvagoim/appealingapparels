import styles from "./WhatsAppButton.module.css";

const RAW = import.meta.env.VITE_WHATSAPP_NUMBER || "919818839792";
const MESSAGE = import.meta.env.VITE_WHATSAPP_MESSAGE || "Hi, I need help with my order.";

// Normalise whatever is in .env to the digits wa.me expects.
function normalize(raw) {
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 10) d = "91" + d;
  else if (d.length === 11 && d.startsWith("0")) d = "91" + d.slice(1);
  return d;
}

const WHATSAPP_URL = `https://wa.me/${normalize(RAW)}?text=${encodeURIComponent(MESSAGE)}`;

export default function WhatsAppButton() {
  return (
    <a
      className={styles.fab}
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat on WhatsApp"
    >
      <svg
        className={styles.icon}
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="#25D366"
          d="M16.04 8.2c-4.3 0-7.79 3.49-7.79 7.79 0 1.37.36 2.71 1.04 3.89L8.2 23.8l3.98-1.04a7.76 7.76 0 0 0 3.86 1.03h.003c4.3 0 7.79-3.49 7.79-7.79 0-2.08-.81-4.03-2.28-5.5a7.74 7.74 0 0 0-5.5-2.3zm0 14.26h-.003a6.46 6.46 0 0 1-3.29-.9l-.236-.14-2.45.64.65-2.39-.154-.245a6.44 6.44 0 0 1-.99-3.42c0-3.56 2.9-6.46 6.47-6.46 1.73 0 3.35.67 4.57 1.9a6.42 6.42 0 0 1 1.89 4.57c0 3.56-2.9 6.46-6.46 6.46zm3.54-4.84c-.19-.1-1.14-.56-1.32-.63-.18-.06-.3-.1-.43.1-.13.19-.5.63-.61.76-.11.13-.23.14-.42.05-.19-.1-.81-.3-1.55-.96-.57-.51-.96-1.14-1.07-1.33-.11-.19-.01-.3.08-.39.09-.09.19-.23.29-.34.1-.11.13-.19.19-.32.06-.13.03-.24-.02-.34-.05-.1-.43-1.04-.59-1.43-.16-.37-.31-.32-.43-.33h-.37c-.13 0-.34.05-.51.24-.18.19-.67.65-.67 1.6s.69 1.86.78 1.99c.1.13 1.36 2.07 3.29 2.9.46.2.82.32 1.1.4.46.15.88.13 1.21.08.37-.06 1.14-.47 1.3-.92.16-.45.16-.83.11-.92-.05-.08-.18-.13-.37-.22z"
        />
      </svg>
    </a>
  );
}
