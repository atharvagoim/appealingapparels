const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
    <path d="M3 8l9 5 9-5M12 13v8" />
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.4" />
  </svg>
);

/** The "Secure Checkout / Easy Returns / Order Tracking" reassurance row —
 *  shared between the full Login/Signup pages and the homepage popup so
 *  they never drift out of sync. */
export const TRUST_ITEMS = [
  { icon: <ShieldIcon />, title: "Secure Checkout", sub: "100% secure payments" },
  { icon: <BoxIcon />, title: "Easy Returns", sub: "Hassle-free returns" },
  { icon: <PinIcon />, title: "Order Tracking", sub: "Track your orders" },
];
