import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { env } from "../config/env";
import { buildCapturedEmail, type CapturedEmail } from "./emailPreview";

export interface SendEmailArgs {
  to: string;
  subject: string;
  htmlBody: string;
  senderKey: string;
}

export interface SendEmailResult {
  messageId: string;
  preview: CapturedEmail | null;
}

function smtpErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "SMTP send failed";
}

function createSmtpTransport(port: number) {
  const secure = port === 465 || port === 2465;
  return nodemailer.createTransport({
    host: env.ETHEREAL_SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
    auth: {
      user: env.ETHEREAL_SMTP_USER,
      pass: env.ETHEREAL_SMTP_PASS,
    },
  } satisfies SMTPTransport.Options);
}

function capture(args: SendEmailArgs, extras: Partial<CapturedEmail> = {}): CapturedEmail | null {
  try {
    return buildCapturedEmail({
      from: env.ETHEREAL_SMTP_FROM_EMAIL,
      to: args.to,
      subject: args.subject,
      body: args.htmlBody,
      messageId: extras.messageId,
      transport: extras.transport ?? "captured",
      etherealUrl: extras.etherealUrl,
    });
  } catch (error) {
    console.warn("[emailSender] Failed to build preview payload", {
      to: args.to,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

/**
 * Free-tier note (Render free blocks outbound SMTP on 25/465/587):
 * Ethereal's default port 587 hangs in production. Try alternate ports, then
 * capture the message locally so jobs still complete. Preview storage is
 * best-effort and must not fail a send.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const ports = Array.from(
    new Set(
      env.NODE_ENV === "production"
        ? [2465, 2525, env.ETHEREAL_SMTP_PORT]
        : [env.ETHEREAL_SMTP_PORT],
    ),
  );

  for (const port of ports) {
    try {
      const info = await createSmtpTransport(port).sendMail({
        from: env.ETHEREAL_SMTP_FROM_EMAIL,
        to: args.to,
        subject: args.subject,
        html: args.htmlBody,
        text: args.htmlBody,
      });
      const etherealUrl = nodemailer.getTestMessageUrl(info) || null;
      const preview = capture(args, {
        messageId: info.messageId,
        transport: "ethereal-smtp",
        etherealUrl,
      });
      if (etherealUrl) {
        console.log("[emailSender] Ethereal preview", { to: args.to, previewUrl: etherealUrl });
      }
      return { messageId: info.messageId, preview };
    } catch (error) {
      console.warn("[emailSender] SMTP port failed", {
        port,
        error: smtpErrorMessage(error),
      });
    }
  }

  const preview = capture(args, { transport: "captured" });
  console.warn("[emailSender] SMTP unreachable; captured locally when preview is available", {
    to: args.to,
    messageId: preview?.messageId ?? `captured-${Date.now()}`,
  });
  return { messageId: preview?.messageId ?? `captured-${Date.now()}`, preview };
}
