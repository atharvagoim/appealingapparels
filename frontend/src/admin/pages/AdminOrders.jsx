import ui from "../admin.module.css";

export default function AdminOrders() {
  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Orders</h1>
          <p className={ui.pageSub}>Customer orders</p>
        </div>
      </div>

      <div className={ui.empty}>
        <p className={ui.emptyTitle}>No orders yet.</p>
        <p className={ui.emptyBody}>
          Orders will appear here once checkout and the backend are connected
          in Phase 4 (Express + MongoDB) and Phase 6 (Razorpay).
        </p>
      </div>
    </div>
  );
}
