import client from "./client";

const withPin = (pin) => ({ headers: { "x-admin-pin": pin } });

/** Admin + PIN: current payment-test-mode state. */
export async function fetchTestModeAdmin(pin) {
  const { data } = await client.get("/admin/payment-test-mode", withPin(pin));
  return data;
}

/** Admin + PIN: switch test mode on/off. The server clamps the amount to ₹1–₹2. */
export async function setTestModeApi(pin, { enabled, amount, minutes }) {
  const { data } = await client.put(
    "/admin/payment-test-mode",
    { enabled, amount, minutes },
    withPin(pin)
  );
  return data;
}

/** Any signed-in user: does THIS user's checkout run in test mode? (Customers always get false.) */
export async function fetchMyTestMode() {
  const { data } = await client.get("/orders/test-mode");
  return data;
}
