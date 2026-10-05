import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";

let client: Resend | null = null;

/**
 * Send an email with Resend. Never throws: email problems must not break orders
 * or webhooks, so failures are logged and reported as `false`.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set: skipped "${options.subject}" to ${options.to}`);
    return false;
  }
  client ??= new Resend(key);
  const from = process.env.EMAIL_FROM ?? "YM Textiles <onboarding@resend.dev>";
  try {
    const { error } = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      react: options.react,
      replyTo: options.replyTo,
    });
    if (error) {
      console.error("[email] send failed", options.subject, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed", options.subject, error);
    return false;
  }
}
