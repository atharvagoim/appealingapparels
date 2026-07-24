import whatsapp from "../assets/whatsapp.png";
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
      <img className={styles.icon} src={whatsapp} alt="" />
    </a>
  );
}
