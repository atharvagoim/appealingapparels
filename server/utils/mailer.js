import nodemailer from "nodemailer";
import config from "../config/env.js";

/**
 * Outbound mail, with two possible transports.
 *
 * 1. Brevo HTTP API (preferred). Set BREVO_API_KEY. Plain HTTPS, so it works
 *    on hosts that block outbound SMTP ports — Render's lower tiers do, which
 *    makes SMTP fail in production while working fine on a laptop.
 * 2. SMTP fallback, via nodemailer. Works with Brevo or any other provider.
 *
 * Set in .env:
 *   BREVO_API_KEY=xkeysib-…              (Brevo → SMTP & API → API keys)
 *   MAIL_FROM=appealingapparels543@gmail.com   (must be a VERIFIED sender)
 *   MAIL_FROM_NAME=Appealing Apparels
 *
 * Or, for SMTP instead:
 *   SMTP_HOST=smtp-relay.brevo.com
 *   SMTP_PORT=587
 *   SMTP_USER=<Brevo SMTP login>
 *   SMTP_PASS=<Brevo SMTP key>
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export const brevoConfigured = Boolean(config.mail.brevoKey);
const smtpConfigured = Boolean(
  config.mail.host && config.mail.user && config.mail.pass
);

export const mailConfigured = brevoConfigured || smtpConfigured;

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user: config.mail.user, pass: config.mail.pass },
    })
  : null;

/** Send one transactional email through Brevo's HTTP API. */
async function sendViaBrevo({ to, name, subject, text, html }) {
  // Global fetch landed in Node 18. On anything older this is the failure,
  // and the message is otherwise a bare "fetch is not defined".
  if (typeof fetch !== "function") {
    throw new Error(
      "This Node version has no global fetch — Node 18+ is required for the Brevo API transport."
    );
  }
  if (!config.mail.from) {
    throw new Error("MAIL_FROM is not set, so Brevo has no sender address.");
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.mail.brevoKey,
    },
    body: JSON.stringify({
      sender: { email: config.mail.from, name: config.mail.fromName },
      to: [{ email: to, name: name || undefined }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    // Brevo explains the refusal in the body — surface all of it, since the
    // usual causes (unverified sender, bad key) are only named there.
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* no readable body */
      }
    }
    throw new Error(
      `Brevo rejected the email (HTTP ${res.status})${detail ? ` — ${detail}` : ""}. ` +
        `Sender was "${config.mail.from}"; it must be verified in Brevo → Senders.`
    );
  }
}

/** Send the password-reset link. Throws if no transport is configured. */
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!mailConfigured) {
    throw new Error("Mail is not configured on the server.");
  }

  const safeName = name || "there";
  const subject = "Reset your Appealing Apparels password";

  const text = [
    `Hi ${safeName},`,
    "",
    "We received a request to reset your Appealing Apparels password.",
    "Open the link below to choose a new one. It expires in 60 minutes and can only be used once.",
    "",
    resetUrl,
    "",
    "If you didn't ask for this, you can safely ignore this email — your password stays unchanged.",
    "",
    "— Appealing Apparels",
  ].join("\n");

  const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111;line-height:1.5">
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your Appealing Apparels password.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                    padding:14px 24px;border-radius:6px;font-weight:700">
            Reset my password
          </a>
        </p>
        <p style="color:#555;font-size:14px">
          This link expires in 60 minutes and can only be used once.<br />
          If the button doesn't work, paste this into your browser:<br />
          <span style="word-break:break-all">${resetUrl}</span>
        </p>
        <p style="color:#555;font-size:14px">
          If you didn't ask for this, you can safely ignore this email — your password stays unchanged.
        </p>
        <p>— Appealing Apparels</p>
      </div>
    `;

  if (brevoConfigured) {
    await sendViaBrevo({ to, name: safeName, subject, text, html });
    return;
  }

  await transporter.sendMail({
    from: `"${config.mail.fromName}" <${config.mail.from}>`,
    to,
    subject,
    text,
    html,
  });
}

/** Logged once at startup so a missing key is obvious before anyone tries it. */
export function describeMailTransport() {
  if (brevoConfigured) {
    return `Brevo API (sender: ${config.mail.from})`;
  }
  if (smtpConfigured) {
    return `SMTP ${config.mail.host}:${config.mail.port} (sender: ${config.mail.from})`;
  }
  return "NOT CONFIGURED — password reset emails will fail";
}
