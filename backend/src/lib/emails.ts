import { prisma } from "./prisma";
import { env } from "../config/env";
import { sendMail } from "./mailer";

/**
 * High-level transactional emails. Each function builds a branded message and
 * hands it to `sendMail` (which never throws), so callers can fire-and-forget.
 */

async function brand() {
  const s = await prisma.companySettings.findFirst({ select: { companyName: true, currency: true, email: true, phone: true } });
  return {
    name: s?.companyName ?? "V Car Rent",
    currency: s?.currency ?? "USD",
    email: s?.email ?? null,
    phone: s?.phone ?? null,
  };
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function dateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const BRAND_COLOR = "#3563f0";

function layout(opts: { companyName: string; heading: string; intro: string; bodyHtml: string; footer?: string | null }) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:${BRAND_COLOR};padding:20px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:.3px;">${opts.companyName}</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 10px;font-size:20px;color:#111827;">${opts.heading}</h1>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#4b5563;">${opts.intro}</p>
            ${opts.bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #eef2f7;font-size:12px;color:#9ca3af;">
            ${opts.footer ?? `This is an automated message from ${opts.companyName}.`}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:7px 0;font-size:13px;color:#6b7280;">${label}</td>
    <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:bold;text-align:right;">${value}</td>
  </tr>`;
}

export interface BookingEmailData {
  bookingNumber: string;
  customerFirstName: string;
  customerEmail: string;
  vehicle: { brand: string; model: string; year: number };
  pickupAt: Date | string;
  returnAt: Date | string;
  pickupLocation: string;
  returnLocation: string;
  rentalDays: number;
  totalAmount: number;
  securityDeposit: number;
}

function bookingDetailsTable(d: BookingEmailData, currency: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:6px 16px;margin:4px 0 20px;">
    ${row("Booking number", d.bookingNumber)}
    ${row("Vehicle", `${d.vehicle.brand} ${d.vehicle.model} (${d.vehicle.year})`)}
    ${row("Pick-up", `${dateTime(d.pickupAt)} · ${d.pickupLocation}`)}
    ${row("Return", `${dateTime(d.returnAt)} · ${d.returnLocation}`)}
    ${row("Duration", `${d.rentalDays} day${d.rentalDays === 1 ? "" : "s"}`)}
    ${row("Total", money(d.totalAmount, currency))}
    ${row("Security deposit", money(d.securityDeposit, currency))}
  </table>`;
}

function bookingText(d: BookingEmailData, currency: string, lead: string) {
  return [
    `Hi ${d.customerFirstName},`,
    "",
    lead,
    "",
    `Booking number: ${d.bookingNumber}`,
    `Vehicle: ${d.vehicle.brand} ${d.vehicle.model} (${d.vehicle.year})`,
    `Pick-up: ${dateTime(d.pickupAt)} - ${d.pickupLocation}`,
    `Return: ${dateTime(d.returnAt)} - ${d.returnLocation}`,
    `Duration: ${d.rentalDays} day(s)`,
    `Total: ${money(d.totalAmount, currency)}`,
    `Security deposit: ${money(d.securityDeposit, currency)}`,
  ].join("\n");
}

export async function sendBookingReceivedEmail(d: BookingEmailData) {
  const b = await brand();
  const lead = `We've received your booking request and our team will confirm it shortly. Here are your details:`;
  await sendMail({
    to: d.customerEmail,
    subject: `Booking received - ${d.bookingNumber} | ${b.name}`,
    html: layout({
      companyName: b.name,
      heading: `Thanks, ${d.customerFirstName}! Your booking request is in.`,
      intro: lead,
      bodyHtml:
        bookingDetailsTable(d, b.currency) +
        `<p style="margin:0;font-size:13px;color:#6b7280;">Status: <strong style="color:#b45309;">Pending confirmation</strong>. No payment is required yet.</p>`,
      footer: b.email ? `Questions? Reply to this email or contact us at ${b.email}.` : null,
    }),
    text: `${bookingText(d, b.currency, lead)}\n\nStatus: Pending confirmation. No payment is required yet.`,
  });
}

export async function sendBookingConfirmedEmail(d: BookingEmailData) {
  const b = await brand();
  const lead = `Good news - your booking is confirmed. We look forward to seeing you at pick-up.`;
  await sendMail({
    to: d.customerEmail,
    subject: `Booking confirmed - ${d.bookingNumber} | ${b.name}`,
    html: layout({
      companyName: b.name,
      heading: `You're all set, ${d.customerFirstName}!`,
      intro: lead,
      bodyHtml:
        bookingDetailsTable(d, b.currency) +
        `<p style="margin:0;font-size:13px;color:#6b7280;">Status: <strong style="color:#047857;">Confirmed</strong>.</p>`,
      footer: b.phone ? `Need to make a change? Call us at ${b.phone}.` : null,
    }),
    text: `${bookingText(d, b.currency, lead)}\n\nStatus: Confirmed.`,
  });
}

export async function sendPasswordResetEmail(d: { email: string; firstName: string; token: string }) {
  const b = await brand();
  const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(d.token)}`;
  const mins = env.RESET_TOKEN_EXPIRES_MIN;
  const lead = `We received a request to reset your ${b.name} password. Click the button below to choose a new one. This link expires in ${mins} minutes.`;
  await sendMail({
    to: d.email,
    subject: `Reset your ${b.name} password`,
    html: layout({
      companyName: b.name,
      heading: "Reset your password",
      intro: lead,
      bodyHtml:
        `<p style="margin:0 0 22px;"><a href="${link}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 22px;border-radius:8px;">Reset password</a></p>` +
        `<p style="margin:0 0 6px;font-size:12px;color:#6b7280;">Or paste this link into your browser:</p>` +
        `<p style="margin:0;font-size:12px;color:${BRAND_COLOR};word-break:break-all;">${link}</p>`,
      footer: "If you didn't request this, you can safely ignore this email - your password won't change.",
    }),
    text: `Hi ${d.firstName},\n\n${lead}\n\nReset your password: ${link}\n\nIf you didn't request this, ignore this email.`,
  });
}
