import LegalPage from "./LegalPage.jsx";
import styles from "./LegalPage.module.css";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="28 July 2026"
      description="How Appealing Apparels collects, uses, and protects your personal information when you shop with us."
    >
      <p>
        This policy explains what personal information Appealing Apparels
        ("we", "us", "our") collects when you use appealingapparels.vercel.app
        (the "Site"), why we collect it, and the choices you have. By using
        the Site or placing an order, you agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <p>When you browse, create an account, or place an order, we collect:</p>
      <ul>
        <li><strong>Account details</strong> — name, email address, and password (stored encrypted, never in plain text).</li>
        <li><strong>Order &amp; shipping information</strong> — delivery address, phone number, and the items you purchase.</li>
        <li><strong>Payment information</strong> — handled entirely by our payment partner, Razorpay. We never see or store your card, UPI, or bank details on our own servers.</li>
        <li><strong>Communications</strong> — messages you send us through the support chat, contact forms, or WhatsApp.</li>
        <li><strong>Usage data</strong> — basic technical information (browser type, pages visited) used to keep the Site working correctly and secure.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To process, ship, and provide updates on your orders.</li>
        <li>To send order confirmations, shipping and delivery updates, and respond to support requests — by email and, where you've provided a number, by WhatsApp.</li>
        <li>To send offers or new-arrival updates, only where you've opted in — you can unsubscribe at any time.</li>
        <li>To detect and prevent fraud, abuse, and security issues.</li>
        <li>To improve the Site and the products and categories we offer.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We don't sell your personal information. We share only what's needed with:</p>
      <ul>
        <li><strong>Razorpay</strong>, to process payments securely.</li>
        <li><strong>Brevo</strong>, to send transactional emails and WhatsApp order updates.</li>
        <li><strong>Shipping and courier partners</strong>, to deliver your order.</li>
        <li>Law enforcement or regulators, only where required by law.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use essential cookies/local storage to keep you signed in and to
        remember what's in your bag between visits. These aren't used to
        track you across other websites.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep account and order information for as long as your account is
        active and as needed to meet our legal, accounting, and tax
        obligations. You can request deletion of your account at any time
        (see below) — we'll retain only what we're legally required to keep,
        such as order records for tax purposes.
      </p>

      <h2>Your rights</h2>
      <p>You can, at any time:</p>
      <ul>
        <li>Access or correct the personal information in your account, directly from your Account page.</li>
        <li>Request a copy of the data we hold about you.</li>
        <li>Request that we delete your account and associated personal data.</li>
        <li>Opt out of marketing emails or WhatsApp updates.</li>
      </ul>
      <p>
        To exercise any of these, email us at{" "}
        <a href="mailto:appealingapparels543@gmail.com">appealingapparels543@gmail.com</a>.
      </p>

      <h2>Children's privacy</h2>
      <p>
        The Site isn't directed at children under 18, and we don't knowingly
        collect personal information from them.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        reflected by updating the date at the top of this page.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your data? Reach us at{" "}
        <a href="mailto:appealingapparels543@gmail.com">appealingapparels543@gmail.com</a>{" "}
        or <a href="tel:+919818839792">+91 98188 39792</a>.
      </p>

      <div className={styles.notice}>
        This page is a starting template covering the standard points a
        privacy policy should include, written for how this store currently
        operates. It hasn't been reviewed by a lawyer — have someone check it
        against India's IT/data-protection rules before you rely on it, and
        update the specifics (retention periods, any additional processors
        you add) as the business changes.
      </div>
    </LegalPage>
  );
}
