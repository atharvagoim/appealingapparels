import { useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";

/**
 * Shipping charges for the whole store — applies publicly, to every customer.
 * The server recomputes the charge at checkout from these same rules, so what
 * is set here is what customers actually pay.
 */
export default function ShippingCard() {
  const { shippingSettings, updateShippingSettings } = useSettings();
  const { enabled, flatRate, freeAbove } = shippingSettings;

  // Text boxes keep what is typed; the saved value follows on each change.
  const [rate, setRate] = useState(String(flatRate));
  const [above, setAbove] = useState(String(freeAbove));
  // If the saved value changes from elsewhere (e.g. settings finish loading),
  // follow it — but never fight what is being typed (an empty box means 0).
  if (Number(rate || 0) !== flatRate) setRate(String(flatRate));
  if (Number(above || 0) !== freeAbove) setAbove(String(freeAbove));

  const digits = (v) => v.replace(/\D/g, "").slice(0, 7);

  return (
    <div className={ui.panel} style={{ padding: 20, marginBottom: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: "1.1rem" }}>Shipping charges</h2>
      <p className={ui.pageSub} style={{ marginBottom: 14, fontSize: "0.88rem" }}>
        Applies to every customer, on the cart and at checkout. Changes go live
        straight away.
      </p>

      <div className={ui.toggleRow}>
        <div className={ui.toggleText}>
          <strong>Charge for shipping</strong>
          <span className={ui.toggleSub}>
            {enabled
              ? "Customers pay shipping unless their order qualifies for free shipping."
              : "Shipping is free for everyone, on every order."}
          </span>
        </div>
        <button
          type="button"
          className={`${ui.toggle} ${enabled ? ui.toggleOn : ""}`}
          onClick={() => updateShippingSettings({ enabled: !enabled })}
          aria-pressed={enabled}
          aria-label="Toggle shipping charges"
        >
          <span className={ui.toggleKnob} />
        </button>
      </div>

      {enabled && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 14 }}>
          <label className={ui.catField} style={{ flex: "1 1 180px" }}>
            <span className={ui.catLabel}>Shipping charge (₹)</span>
            <input
              className={ui.catInput}
              inputMode="numeric"
              value={rate}
              onChange={(e) => {
                const v = digits(e.target.value);
                setRate(v);
                updateShippingSettings({ flatRate: v === "" ? 0 : Number(v) });
              }}
            />
          </label>
          <label className={ui.catField} style={{ flex: "1 1 180px" }}>
            <span className={ui.catLabel}>Free shipping above (₹)</span>
            <input
              className={ui.catInput}
              inputMode="numeric"
              value={above}
              placeholder="0 = no free-shipping threshold"
              onChange={(e) => {
                const v = digits(e.target.value);
                setAbove(v);
                updateShippingSettings({ freeAbove: v === "" ? 0 : Number(v) });
              }}
            />
          </label>
        </div>
      )}

      <p className={ui.pageSub} style={{ marginTop: 12, fontSize: "0.82rem" }}>
        {!enabled
          ? "Customers will see “Free shipping — on every order”."
          : freeAbove > 0
          ? `Orders of ₹${freeAbove.toLocaleString("en-IN")} or more ship free; smaller orders pay ₹${flatRate}.`
          : `Every order pays ₹${flatRate} — there is no free-shipping threshold.`}
      </p>
    </div>
  );
}
