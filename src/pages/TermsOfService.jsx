import LegalPage from "./LegalPage.jsx";
import styles from "./LegalPage.module.css";

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="28 July 2026"
      description="The terms and conditions that apply when you use Appealing Apparels and place an order with us."
    >
      <p>
        These terms govern your use of appealingapparels.vercel.app (the
        "Site") and any order you place through it. By using the Site, you
        agree to them.
      </p>

      <h2>Using the Site</h2>
      <p>
        You must be at least 18 years old, or using the Site under the
        supervision of a parent or guardian, to create an account or place an
        order. You're responsible for keeping your account password secure
        and for all activity under your account.
      </p>

      <h2>Products &amp; pricing</h2>
      <ul>
        <li>All prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
        <li>Product photos are for illustration — colour may vary slightly depending on your screen and lighting.</li>
        <li>We reserve the right to correct pricing or listing errors, and to limit quantities on any product.</li>
        <li>We may discontinue or update products, colours, and availability at any time without notice.</li>
      </ul>

      <h2>Orders &amp; payment</h2>
      <p>
        Placing an order is an offer to buy — we confirm it once payment is
        successfully verified. Payments are processed securely through
        Razorpay; we don't store your card or bank details. We may cancel an
        order (with a full refund) if we discover a pricing or stock error,
        or suspect fraud.
      </p>

      <h2>Shipping</h2>
      <p>
        Estimated delivery times are shown at checkout and are our best
        estimate, not a guarantee — they can be affected by courier delays
        outside our control. Once your order ships, you'll get tracking
        details so you can follow its progress.
      </p>

      <h2>Cancellations</h2>
      <p>
        You can cancel an order before it ships by contacting us — see our{" "}
        <a href="/refund-policy">Refund Policy</a> for what happens after
        that, and for returns and exchanges once an order is delivered.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Everything on the Site — the Appealing Apparels name and logo,
        product photography, and site content — belongs to us or our
        licensors. You may not copy, reproduce, or reuse it without our
        written permission.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        We work hard to keep the Site accurate and available, but we don't
        guarantee it will be error-free or uninterrupted. To the extent
        permitted by law, we aren't liable for indirect or consequential
        losses arising from your use of the Site; our liability for any
        claim relating to an order is limited to the amount you paid for
        that order.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and any dispute is
        subject to the exclusive jurisdiction of the courts of Delhi.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continuing to use the
        Site after a change means you accept the updated terms.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these terms? Reach us at{" "}
        <a href="mailto:appealingapparels543@gmail.com">appealingapparels543@gmail.com</a>{" "}
        or <a href="tel:+919818839792">+91 98188 39792</a>.
      </p>

      <div className={styles.notice}>
        This page is a starting template covering the standard terms an
        e-commerce store needs. It hasn't been reviewed by a lawyer — have
        someone check it against India's Consumer Protection (E-Commerce)
        Rules before you rely on it, and fill in your registered business
        details if you incorporate formally.
      </div>
    </LegalPage>
  );
}
