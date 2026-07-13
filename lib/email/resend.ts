import "server-only";

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// From address must be on a Resend-verified domain (send.sasw.co). Until the
// domain is verified, onboarding@resend.dev works but only delivers to the
// account owner.
export const EMAIL_FROM =
  process.env.RESEND_FROM ?? "SASTW <onboarding@resend.dev>";

// Optional monitored reply-to inbox.
export const EMAIL_REPLY_TO = process.env.RESEND_REPLY_TO?.trim() || undefined;
