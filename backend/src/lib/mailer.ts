import nodemailer, { Transporter } from "nodemailer";
import { env, isTest } from "../config/env";
import { logger } from "./logger";

/**
 * Transactional email transport.
 *
 * - If SMTP_HOST is configured, a real SMTP transport is used.
 * - Otherwise a dev fallback (`jsonTransport`) is used: nothing is actually
 *   sent, the message is logged instead. This keeps booking and password-reset
 *   flows fully functional locally without a mail provider, and the app becomes
 *   production-ready simply by setting the SMTP_* env vars.
 *
 * `sendMail` never throws - a mail failure must never break the business
 * operation that triggered it (creating a booking, requesting a reset, ...).
 */
let transporter: Transporter | null = null;
let mode: "smtp" | "log" = "log";

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    mode = "smtp";
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    mode = "log";
  }
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  if (isTest) return; // never send (or log noise) during tests
  try {
    const info = await getTransporter().sendMail({ from: env.MAIL_FROM, ...msg });
    if (mode === "log") {
      logger.info(
        { to: msg.to, subject: msg.subject, body: msg.text },
        "[mailer] no SMTP configured - email logged, not sent"
      );
    } else {
      logger.info({ to: msg.to, subject: msg.subject, messageId: info.messageId }, "email sent");
    }
  } catch (err) {
    logger.error({ err, to: msg.to, subject: msg.subject }, "failed to send email");
  }
}
