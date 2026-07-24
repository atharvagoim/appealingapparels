import { useAuth } from "../context/AuthContext";
import AdminLogin from "../admin/AdminLogin";

/**
 * Admin gate. Instead of redirecting to the customer /login, it shows a
 * dedicated admin sign-in *in place* at /admin. Only role "admin" passes;
 * the server still independently enforces admin-only API routes.
 */
export default function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40 }}>Checking access…</div>;
  }
  if (!isAdmin) {
    return <AdminLogin />;
  }
  return children;
}
