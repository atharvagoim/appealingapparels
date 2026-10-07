import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import ErrorPage from "./pages/ErrorPage";

/**
 * Code-splitting: only the shell (Layout) and the homepage (Home) ship in
 * the main bundle, since that's what every first-time visitor has to
 * download before seeing anything. Everything else — every other storefront
 * page and the entire admin panel — loads its own small chunk on demand,
 * the moment someone actually navigates there. This is a pure bundling
 * change: same components, same behaviour, just fetched lazily instead of
 * all up front.
 */
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));

const RequireAdmin = lazy(() => import("./components/RequireAdmin"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const AdminProducts = lazy(() => import("./admin/pages/AdminProducts"));
const AdminCover = lazy(() => import("./admin/pages/AdminCover"));
const AdminAuthImages = lazy(() => import("./admin/pages/AdminAuthImages"));
const AdminCategories = lazy(() => import("./admin/pages/AdminCategories"));
const AdminSocial = lazy(() => import("./admin/pages/AdminSocial.jsx"));
const AdminSections = lazy(() => import("./admin/pages/AdminSections"));
const AdminFooter = lazy(() => import("./admin/pages/AdminFooter"));
const AdminSupport = lazy(() => import("./admin/pages/AdminSupport"));
const AdminReviews = lazy(() => import("./admin/pages/AdminReviews.jsx"));
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminCustomers = lazy(() => import("./admin/pages/AdminCustomers"));
const AdminCoupons = lazy(() => import("./admin/pages/AdminCoupons"));
const AdminTeam = lazy(() => import("./admin/pages/AdminTeam"));

/** Minimal, dependency-free fallback while a lazy chunk downloads. */
function RouteFallback() {
  return <div style={{ padding: 40, textAlign: "center" }}>Loading…</div>;
}

/** Wraps a lazy element in the shared fallback, so every route below reads
 *  the same as before — just one extra Suspense layer, no behaviour change. */
const withSuspense = (element) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    // Catches anything a page throws, so a shopper sees a real page rather
    // than React Router's developer stack trace.
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: withSuspense(<Shop />) },
      { path: "product/:slug", element: withSuspense(<Product />) },
      { path: "cart", element: withSuspense(<Cart />) },
      { path: "wishlist", element: withSuspense(<Wishlist />) },
      { path: "login", element: withSuspense(<Login />) },
      { path: "signup", element: withSuspense(<Signup />) },
      { path: "forgot-password", element: withSuspense(<ForgotPassword />) },
      { path: "reset-password", element: withSuspense(<ResetPassword />) },
      { path: "checkout", element: withSuspense(<Checkout />) },
      { path: "orders", element: withSuspense(<Orders />) },
      { path: "account", element: withSuspense(<Account />) },
      { path: "about", element: withSuspense(<About />) },
      { path: "privacy-policy", element: withSuspense(<PrivacyPolicy />) },
      { path: "terms-of-service", element: withSuspense(<TermsOfService />) },
      { path: "refund-policy", element: withSuspense(<RefundPolicy />) },
    ],
  },
  {
    path: "/admin",
    element: withSuspense(
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: withSuspense(<Dashboard />) },
      { path: "products", element: withSuspense(<AdminProducts />) },
      { path: "sections", element: withSuspense(<AdminSections />) },
      { path: "cover", element: withSuspense(<AdminCover />) },
      { path: "auth-images", element: withSuspense(<AdminAuthImages />) },
      { path: "categories", element: withSuspense(<AdminCategories />) },
      // Store settings now live on the combined Social & Store page.
      { path: "store", element: <Navigate to="/admin/social" replace /> },
      { path: "social", element: withSuspense(<AdminSocial />) },
      { path: "footer", element: withSuspense(<AdminFooter />) },
      { path: "support", element: withSuspense(<AdminSupport />) },
      { path: "orders", element: withSuspense(<AdminOrders />) },
      { path: "customers", element: withSuspense(<AdminCustomers />) },
      { path: "reviews", element: withSuspense(<AdminReviews />) },
      { path: "coupons", element: withSuspense(<AdminCoupons />) },
      { path: "team", element: withSuspense(<AdminTeam />) },
    ],
  },
]);
