import { useState } from "react";
import { fetchTeam, addTeamMemberApi, removeTeamMemberApi, setPrimaryTeamMemberApi } from "../../api/teamApi";
import ui from "../admin.module.css";

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
    <path d="M10 11.5v6M14 11.5v6" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const emptyForm = { name: "", email: "", password: "" };

export default function AdminTeam() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [team, setTeam] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [lockingId, setLockingId] = useState("");

  const unlock = async (e) => {
    e.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const list = await fetchTeam(pin.trim());
      setTeam(list);
      setUnlocked(true);
    } catch (err) {
      setUnlockError(
        err?.response?.data?.message ||
          (err?.request && !err?.response
            ? "Couldn't reach the server — check your connection."
            : "Couldn't verify the PIN. Please try again.")
      );
    } finally {
      setUnlocking(false);
    }
  };

  const refresh = async () => setTeam(await fetchTeam(pin.trim()));

  const addMember = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormOk("");
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError("Name, email and password are all required.");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      const added = await addTeamMemberApi(pin.trim(), form);
      setFormOk(`${added?.name || form.name} now has admin access.`);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Couldn't add that account.");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (member) => {
    if (
      !window.confirm(
        `Remove admin access for ${member.name} (${member.email})? They'll no longer be able to sign in to the admin panel.`
      )
    )
      return;
    setRemovingId(member.id);
    try {
      await removeTeamMemberApi(pin.trim(), member.id);
      await refresh();
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't remove that account.");
    } finally {
      setRemovingId("");
    }
  };

  const [lockTarget, setLockTarget] = useState(null);
  const [confirmPin, setConfirmPin] = useState("");
  const [lockError, setLockError] = useState("");

  const openLockDialog = (member) => {
    setLockTarget(member);
    setConfirmPin("");
    setLockError("");
  };

  const confirmLock = async (e) => {
    e.preventDefault();
    setLockError("");
    setLockingId(lockTarget.id);
    try {
      await setPrimaryTeamMemberApi(pin.trim(), lockTarget.email, confirmPin.trim());
      setLockTarget(null);
      await refresh();
    } catch (err) {
      setLockError(err?.response?.data?.message || "Couldn't move the lock to that account.");
    } finally {
      setLockingId("");
    }
  };

  if (!unlocked) {
    return (
      <div>
        <div className={ui.pageHead}>
          <div>
            <h1 className={ui.pageTitle}>Admin Access</h1>
            <p className={ui.pageSub}>
              Add or remove who can sign in to this admin panel.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "8vh",
          }}
        >
          <div
            className={ui.panel}
            style={{
              padding: "40px 28px",
              width: "100%",
              maxWidth: 380,
              textAlign: "center",
            }}
          >
            <div style={{ color: "var(--ink)", marginBottom: 14 }}>
              <LockIcon />
            </div>
            <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Enter the access PIN</h2>
            <p className={ui.pageSub} style={{ marginBottom: 20, fontSize: "0.88rem" }}>
              This section is extra-protected — you'll need the 6-digit PIN
              even though you're already signed in as an admin.
            </p>

            <form onSubmit={unlock}>
              {unlockError && (
                <p
                  style={{
                    background: "#fbeaea",
                    color: "#9a2b2b",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 14,
                  }}
                >
                  {unlockError}
                </p>
              )}
              <input
                className={ui.catInput}
                style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em" }}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
              <button
                className={ui.btn}
                type="submit"
                disabled={unlocking || pin.length < 6}
                style={{ width: "100%", marginTop: 14 }}
              >
                {unlocking ? "Checking…" : "Unlock"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Admin Access</h1>
          <p className={ui.pageSub}>
            {team.length} {team.length === 1 ? "person has" : "people have"} access to
            this admin panel.
          </p>
        </div>
      </div>

      <div className={ui.panel} style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: "1.1rem" }}>Team</h2>

        {team.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <strong style={{ fontSize: "0.94rem" }}>{m.name}</strong>
                {m.isPrimary && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#1e6b34",
                      background: "#e7f4ea",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    Primary · locked
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-faint)", margin: "2px 0 0", overflowWrap: "anywhere" }}>
                {m.email}
              </p>
            </div>

            {!m.isPrimary && (
              <div style={{ display: "flex", gap: 8, flex: "none" }}>
                <button
                  type="button"
                  className={ui.btn}
                  style={{ minHeight: 34, padding: "0 14px", fontSize: "0.78rem" }}
                  onClick={() => openLockDialog(m)}
                  disabled={lockingId === m.id}
                >
                  {lockingId === m.id ? "Locking…" : "Lock"}
                </button>
                <button
                  type="button"
                  className={ui.deleteIconBtn}
                  onClick={() => removeMember(m)}
                  disabled={removingId === m.id}
                  aria-label={`Remove ${m.name}`}
                  title="Remove admin access"
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={ui.panel} style={{ padding: 20, maxWidth: 480 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: "1.1rem" }}>
          Add someone
        </h2>
        <p className={ui.pageSub} style={{ marginBottom: 14, fontSize: "0.88rem" }}>
          They'll be able to sign in at /admin with the email and password
          you set here.
        </p>

        <form onSubmit={addMember}>
          {formOk && (
            <p
              style={{
                background: "#e7f4ea",
                color: "#1e6b34",
                fontSize: "0.86rem",
                fontWeight: 600,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 14,
              }}
            >
              {formOk}
            </p>
          )}
          {formError && (
            <p
              style={{
                background: "#fbeaea",
                color: "#9a2b2b",
                fontSize: "0.86rem",
                fontWeight: 600,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 14,
              }}
            >
              {formError}
            </p>
          )}

          <label className={ui.catField} style={{ marginBottom: 12 }}>
            <span className={ui.catLabel}>Name</span>
            <input
              className={ui.catInput}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className={ui.catField} style={{ marginBottom: 12 }}>
            <span className={ui.catLabel}>Email</span>
            <input
              className={ui.catInput}
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className={ui.catField} style={{ marginBottom: 16 }}>
            <span className={ui.catLabel}>Password</span>
            <input
              className={ui.catInput}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="At least 6 characters"
            />
          </label>

          <button className={ui.btn} type="submit" disabled={saving}>
            {saving ? "Adding…" : "+ Add team member"}
          </button>
        </form>
      </div>

      {lockTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(10,10,10,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setLockTarget(null)}
        >
          <div
            className={ui.panel}
            style={{ padding: 24, width: "100%", maxWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: "1.05rem" }}>
              Lock {lockTarget.name}?
            </h2>
            <p className={ui.pageSub} style={{ fontSize: "0.86rem", marginBottom: 16 }}>
              This is a separate confirmation PIN from the one you unlocked
              this page with. Whoever is currently locked will become
              removable again.
            </p>

            <form onSubmit={confirmLock}>
              {lockError && (
                <p
                  style={{
                    background: "#fbeaea",
                    color: "#9a2b2b",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 14,
                  }}
                >
                  {lockError}
                </p>
              )}
              <input
                className={ui.catInput}
                style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.3em" }}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnGhost}`}
                  style={{ flex: 1 }}
                  onClick={() => setLockTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className={ui.btn}
                  type="submit"
                  style={{ flex: 1 }}
                  disabled={lockingId === lockTarget.id || confirmPin.length < 6}
                >
                  {lockingId === lockTarget.id ? "Locking…" : "Confirm lock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
