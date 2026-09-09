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
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Measurement is never worth an exception in a submit handler.
  }
}
