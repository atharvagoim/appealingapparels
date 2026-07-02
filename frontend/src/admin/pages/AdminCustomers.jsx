import ui from "../admin.module.css";

export default function AdminCustomers() {
  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Customers</h1>
          <p className={ui.pageSub}>Registered customers</p>
        </div>
      </div>

      <div className={ui.empty}>
        <p className={ui.emptyTitle}>No customers yet.</p>
        <p className={ui.emptyBody}>
          Customer accounts will appear here once authentication is added in
          Phase 5 (JWT user and admin login).
        </p>
      </div>
    </div>
  );
}
