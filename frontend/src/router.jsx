import { createBrowserRouter } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import ErrorPage from "./pages/ErrorPage";

import RequireAdmin from "./components/RequireAdmin";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminCover from "./admin/pages/AdminCover";
import AdminCategories from "./admin/pages/AdminCategories";
import AdminStore from "./admin/pages/AdminStore";
import AdminSocial from "./admin/pages/AdminSocial.jsx";
import AdminSections from "./admin/pages/AdminSections";
import AdminFooter from "./admin/pages/AdminFooter";
import AdminSizeChart from "./admin/pages/AdminSizeChart";
import AdminSupport from "./admin/pages/AdminSupport";
import AdminReviews from "./admin/pages/AdminReviews.jsx";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminCustomers from "./admin/pages/AdminCustomers";
import AdminCoupons from "./admin/pages/AdminCoupons";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    // Catches anything a page throws, so a shopper sees a real page rather
    // than React Router's developer stack trace.
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "product/:slug", element: <Product /> },
      { path: "cart", element: <Cart /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "checkout", element: <Checkout /> },
      { path: "orders", element: <Orders /> },
      { path: "account", element: <Account /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "products", element: <AdminProducts /> },
      { path: "sections", element: <AdminSections /> },
      { path: "cover", element: <AdminCover /> },
      { path: "categories", element: <AdminCategories /> },
      { path: "store", element: <AdminStore /> },
      { path: "social", element: <AdminSocial /> },
      { path: "footer", element: <AdminFooter /> },
      { path: "size-chart", element: <AdminSizeChart /> },
      { path: "support", element: <AdminSupport /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "customers", element: <AdminCustomers /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "coupons", element: <AdminCoupons /> },
    ],
  },
]);
