import client from "./client";

/**
 * Every call here needs the access PIN, sent as a header so it travels with
 * the request without being part of the URL or a stored body shape. The PIN
 * is checked again on the server on every single call — entering it in the
 * UI only unlocks the screen locally, it isn't itself the security.
 */
const withPin = (pin) => ({ headers: { "x-admin-pin": pin } });

export async function fetchTeam(pin) {
  const { data } = await client.get("/admin/team", withPin(pin));
  return data;
}

export async function addTeamMemberApi(pin, { name, email, password }) {
  const { data } = await client.post(
    "/admin/team",
    { name, email, password },
    withPin(pin)
  );
  return data;
}

export async function removeTeamMemberApi(pin, id) {
  const { data } = await client.delete(`/admin/team/${id}`, withPin(pin));
  return data;
}

/** Moves the "locked, can't be removed" status to a different admin account
 *  — this automatically un-locks whoever had it before. `confirmPin` is a
 *  second, distinct PIN asked specifically for this action. */
export async function setPrimaryTeamMemberApi(pin, email, confirmPin) {
  const { data } = await client.post(
    "/admin/team/primary",
    { email, confirmPin },
    withPin(pin)
  );
  return data;
}
