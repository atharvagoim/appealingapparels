import LegalPage from "./LegalPage.jsx";
import styles from "./LegalPage.module.css";

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund & Return Policy"
      updated="28 July 2026"
      description="Our returns, exchanges, and refund process for Appealing Apparels orders."
    >
      <p>
        We want you to love what you ordered. If something isn't right, here's
        how returns, exchanges, and refunds work.
      </p>

      <h2>Return window</h2>
      <p>
        You can return an item within <strong>7 days of delivery</strong> for
        a refund or exchange, as long as it meets the conditions below.
      </p>

      <h2>Condition for a return</h2>
      <ul>
        <li>The item is unused, unwashed, and in its original condition.</li>
        <li>All original tags and packaging are intact.</li>
        <li>You have your order number or confirmation email as proof of purchase.</li>
      </ul>
      <p>
        Items marked as final sale or clearance at the time of purchase
        aren't eligible for return unless they arrive damaged or defective.
      </p>

      <h2>How to start a return</h2>
      <p>
        Email <a href="mailto:appealingapparels543@gmail.com">appealingapparels543@gmail.com</a>{" "}
        or message us on WhatsApp at{" "}
        <a href="https://wa.me/919818839792" target="_blank" rel="noopener noreferrer">
          +91 98188 39792
        </a>{" "}
        with your order number and the reason for the return. We'll confirm
        eligibility and share the return shipping details.
      </p>

      <h2>Damaged or incorrect items</h2>
      <p>
        If your order arrives damaged, defective, or different from what you
        ordered, contact us within <strong>48 hours of delivery</strong> with
        photos of the item and packaging — we'll arrange a free replacement
        or full refund, no return shipping cost to you.
      </p>

      <h2>Refunds</h2>
      <p>
        Once we receive and inspect your returned item, we'll process your
        refund to the original payment method via Razorpay, typically within{" "}
        <strong>5–7 business days</strong>. You'll get an email once it's
        processed — banks can take a few extra days to reflect it on your
        statement.
      </p>

      <h2>Exchanges</h2>
      <p>
        Want a different colour or size instead of a refund? Let us know when
        you start your return — subject to stock availability, we'll ship the
        replacement out once we've received the original item back.
      </p>

      <h2>Return shipping costs</h2>
      <p>
        For change-of-mind returns, return shipping is your responsibility
        unless stated otherwise at checkout. For damaged, defective, or
        wrong items, we cover it.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about a return or refund? Reach us at{" "}
        <a href="mailto:appealingapparels543@gmail.com">appealingapparels543@gmail.com</a>{" "}
        or <a href="tel:+919818839792">+91 98188 39792</a>.
      </p>

      <div className={styles.notice}>
        This page is a starting template with commonly used timeframes (7-day
        return window, 5–7 business day refunds). Adjust the numbers to match
        how you actually plan to operate, and have it reviewed against
        India's Consumer Protection (E-Commerce) Rules before relying on it.
      </div>
    </LegalPage>
  );
}
