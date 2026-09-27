import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/event";

/**
 * Unsubscribe links for team emails.
 *
 * Each link names a registration and carries an HMAC of its id, so a link
 * can only unsubscribe the person it was sent to — ids are not secret enough
 * on their own to let anyone who guesses one opt someone else out.
 *
 * Keyed off CRON_SECRET, which every environment already has, under its own
 * prefix so a token for one purpose is never valid for the other. With no
 * secret configured there are no links, and the send refuses rather than
 * mailing everyone an email they can't leave.
 */

const SECRET = process.env.CRON_SECRET?.trim() || "";

export function unsubscribeReady(): boolean {
  return SECRET.length > 0;
}

function sign(id: string): string {
  return createHmac("sha256", SECRET).update(`unsubscribe:${id}`).digest("base64url").slice(0, 32);
}

export function unsubscribeToken(id: string): string {
  if (!SECRET) throw new Error("CRON_SECRET is not set; unsubscribe links cannot be signed.");
  return sign(id);
}

export function verifyUnsubscribe(id: string, token: string): boolean {
  if (!SECRET || !id || !token) return false;
  const want = Buffer.from(sign(id));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** The page a reader lands on from the footer link. */
export function unsubscribePageUrl(id: string): string {
  return `${SITE_URL}/unsubscribe?r=${encodeURIComponent(id)}&t=${unsubscribeToken(id)}`;
}

/**
 * The one-click endpoint (RFC 8058): Gmail and Yahoo POST here from their own
 * "Unsubscribe" button, without opening the page.
 */
export function unsubscribeOneClickUrl(id: string): string {
  return `${SITE_URL}/api/unsubscribe?r=${encodeURIComponent(id)}&t=${unsubscribeToken(id)}`;
}

/** The field on a registration that records the opt-out. */
export const UNSUBSCRIBED_FIELD = "unsubscribedAt";
