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

// Team inboxes notified when a Get Involved submission lands (per the 2026
// form requirements routing table). Override with a comma-separated env var.
export const TEAM_NOTIFY_TO = (
  process.env.TEAM_NOTIFY_EMAILS ??
  "programs@geekdom.com,lesliechasnoff@geekdom.com,brooke@geekdom.com"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Weekly registration digest list — the routing table adds justin@ here.
export const DIGEST_TO = (
  process.env.DIGEST_EMAILS ??
  "programs@geekdom.com,lesliechasnoff@geekdom.com,brooke@geekdom.com,justin@geekdom.com"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
