import { track as vercelTrack } from "@vercel/analytics";

/**
 * Conversion events, sent to GA from the browser.
 *
 * Until now the site tracked traffic and nothing else, so the two questions
 * marketing actually asks — which channel produced signups, and did that
 * campaign work — had no answer at all. GA could see 415 sessions from Email
 * and 375 from Organic Social; it could not see that either produced a single
 * one of the registrations, because a registration was not an event.
 *
 * Sending one closes that: GA attributes an event to the session's source,
 * medium and campaign on its own, so a single call per successful submit turns
 * every acquisition report into a conversion report. Nothing else is needed —
 * no UTM plumbing in the app, since GA reads those off the landing URL.
 */
declare global {
  interface Window {
    gtag?: (
      command: string,
      nameOrId: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

/** Event names, in one place so a report is not chasing a typo. */
export const CONVERSIONS = {
  register: "sign_up",
  getInvolved: "generate_lead",
  speaker: "speaker_application",
} as const;

/**
 * Fire and forget. Absent gtag — a blocked script, an admin route where
 * analytics does not load, SSR — this does nothing rather than throwing: a
 * form must never fail because a measurement script did.
 */
export function trackConversion(
  event: (typeof CONVERSIONS)[keyof typeof CONVERSIONS],
  params?: Record<string, unknown>,
): void {
  trackEvent(event, params);
}

/**
 * Any other GA event, under the same guarantee: absent gtag, nothing happens.
 * For measurement that is not a conversion — how far a reader got through
 * the sponsor report, say — so CONVERSIONS stays the list of things that
 * count as one.
 */
export function trackEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (window.gtag) {
      window.gtag("event", event, params);
      return;
    }
    // Sent before the GA tag has defined gtag — an event fired on load, say,
    // which runs ahead of an afterInteractive script. Queue it the way gtag's
    // own stub does, onto dataLayer as an `arguments` object (gtag.js reads
    // only those, not plain arrays), and the tag picks it up when it loads.
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    (function queue(...args: unknown[]) {
      void args; // the parameters exist for the call's types; `arguments` is what is pushed
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    })("event", event, params);
  } catch {
    // Measurement is never worth an exception in a submit handler.
  }
}

/**
 * A sponsor-report reading event, sent to both GA and Vercel Analytics.
 *
 * GA is where the reports are built, but its tag is on most blocklists, and a
 * sponsor reading on a locked-down work machine may never reach it. Vercel's
 * collector is first-party (/_vercel/insights on the site's own origin), so
 * it survives most blockers — a second count of the same events, for when
 * the two disagree. Vercel only records custom events on plans that include
 * them; on others the call is a no-op, never an error.
 */
export function trackReport(
  event: "report_view" | "report_section" | "report_download",
  params: Record<string, string | undefined>,
): void {
  trackEvent(event, params);
  try {
    vercelTrack(event, params);
  } catch {
    // As above: never worth an exception.
  }
}
