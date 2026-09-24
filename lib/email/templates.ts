// Branded transactional emails in SASTW voice. Terse, active, one metaphor.
// Inline styles only — email clients don't load external CSS or web fonts.
//
// The COPY (subject, heading, body, CTA intro, sign-off) is editable by admins
// in the portal and stored in Firestore; the brand chrome (logo header,
// calendar block, footer) is locked here. This module is PURE — no server-only
// deps — so the same render functions drive the live preview in the browser.

import { SITE_URL } from "@/lib/event";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar";

const MAGENTA = "#ff32a0";
const BLACK = "#000000";
const INK = "#111111";
const MUTED = "#52525b";

// White horizontal combo logo, rasterized to PNG (email clients don't render
// SVG) and hosted on Vercel Blob. 4:1 aspect ratio; displayed at 240×60.
const LOGO_URL =
  "https://t4605hkishzuvveg.public.blob.vercel-storage.com/email/sastw-logo-white.png?v=2";

// ─── Editable copy model ────────────────────────────────────────────────────

export interface EmailCopy {
  subject: string;
  heading: string;
  /**
   * Blank-line-separated paragraphs. Supports {firstName} and {sessionTitle}.
   * A paragraph starting "## " is a section subhead, and bare URLs
   * (https://… or www.…) become links.
   */
  body: string;
  /** Line shown just above the add-to-calendar block. Blank to omit. */
  ctaIntro: string;
  /** Closing line. Blank to omit. */
  signoff: string;
}

export type EmailTemplateKey =
  | "registration"
  | "speaker"
  | "speakerAccepted"
  | "speakerDeclined"
  | "getInvolvedSponsor"
  | "getInvolvedHost"
  | "getInvolvedGeneral"
  | "knowBeforeYouGo";

export interface TemplateVars {
  firstName: string;
  sessionTitle?: string;
}

// The confirmation, now the schedule is live and people register days out or
// on the morning. It carries what someone needs on the way in — where to get a
// badge, where to park, where the schedule is — as blocks rather than prose:
// the first version was eight paragraphs and read as a wall. Facts are
// lib/faq.ts's; keep the two agreeing. See "Body blocks" below for the markers.
export const DEFAULT_REGISTRATION_COPY: EmailCopy = {
  subject: "You're in. The schedule is live.",
  heading: "You're in.",
  body: [
    "See you downtown, {firstName}.\nSept 28 – Oct 2, six rooms, free.",
    "[See the schedule](https://www.sasw.co/schedule)",
    "## Badge pickup",
    "> Check in by name at any desk. Nothing to print — one badge works all week.",
    "Texas Public Radio | 321 W Commerce St\nThe Rand | 110 E Houston St, 3rd Floor\nCentral Library | 600 Soledad St",
    "## Parking",
    "City Tower | 60 N Flores St · $10 all day\nSt. Mary's Garage | 205 E Travis St · $10 all day\nHouston Street | 111 College St · $10 all day\nCentral Library | 600 Soledad St · 3 hrs free, then $5",
    "## Thursday night",
    "Startup Bash | Oct 1 · 6 – 8 PM · Legacy Park",
    "Badges, parking and access in full: www.sasw.co/faq",
  ].join("\n\n"),
  ctaIntro: "Put the week on your calendar:",
  signoff: "Plug in.",
};

export const DEFAULT_SPEAKER_COPY: EmailCopy = {
  subject: "Got your session. We'll be in touch.",
  heading: "You pitched. We got it.",
  body: [
    "Thanks, {firstName}.",
    "Your session — {sessionTitle} — is in the review queue for San Antonio Startup + Tech Week, Sept 28 – Oct 2 (Year 11).",
    "We read every one. You'll hear back once the Circuit lineup takes shape.",
  ].join("\n\n"),
  ctaIntro: "Block the week so it's on your radar either way:",
  signoff: "Plug in.",
};

// The two decision emails, sent from the admin when a submission's status
// changes — see `updateSubmissionStatus`. Everything before these is a receipt
// for something the reader did; these are an answer to it, which is why both
// say what happens next rather than thanking and stopping.
export const DEFAULT_SPEAKER_ACCEPTED_COPY: EmailCopy = {
  subject: "You're in the lineup.",
  heading: "You're in.",
  body: [
    "{sessionTitle} is on the schedule for San Antonio Startup + Tech Week, Sept 28 – Oct 2.",
    "Someone from the team will be in touch directly to lock your day and time. Nothing to do until then \u2014 hold the week and we will come to you with a slot.",
    "If anything about the session has changed since you pitched it, reply here and tell us.",
  ].join("\n\n"),
  ctaIntro: "Hold the week:",
  signoff: "Plug in.",
};

// No consolation prize and no vague door-holding. It says the real reason,
// says what is still open, and stops.
export const DEFAULT_SPEAKER_DECLINED_COPY: EmailCopy = {
  subject: "Not this year \u2014 thank you for pitching.",
  heading: "Not this one.",
  body: [
    "Thanks for pitching {sessionTitle}, {firstName}. We read every submission, and we could not fit this one into the 2026 lineup.",
    "That is a room-and-hours problem rather than a verdict on the talk \u2014 the circuits fill up faster every year.",
    "You are welcome at the week either way. Registration is free and covers all five days.",
  ].join("\n\n"),
  ctaIntro: "The dates, if you want them:",
  signoff: "Plug in.",
};

// Get Involved confirmations — response-time promises come from the 2026 form
// requirements (sponsor: 2 business days, host: 5, general: 3).
export const DEFAULT_GET_INVOLVED_SPONSOR_COPY: EmailCopy = {
  subject: "Got it — let's power the week.",
  heading: "Got it.",
  body: [
    "Thanks, {firstName}.",
    "Your sponsorship inquiry for San Antonio Startup + Tech Week (Sept 28 – Oct 2) is in. Someone from our sponsor team will be in touch within 2 business days.",
    "Sponsors are the grid the current runs on. Let's build it.",
  ].join("\n\n"),
  ctaIntro: "Hold the dates while we connect:",
  signoff: "Plug in.",
};

export const DEFAULT_GET_INVOLVED_HOST_COPY: EmailCopy = {
  subject: "Got your event. We're on it.",
  heading: "Got it.",
  body: [
    "Thanks, {firstName}.",
    "We'll review your submission and get back to you within 5 business days. Some anchor events and key session dates/times are locked, so if we need to shift your time, we'll work it out with you.",
    "Every room on the grid makes the current stronger.",
  ].join("\n\n"),
  ctaIntro: "Block the week while we review:",
  signoff: "Plug in.",
};

export const DEFAULT_GET_INVOLVED_GENERAL_COPY: EmailCopy = {
  subject: "Got your question.",
  heading: "Got it.",
  body: [
    "Thanks, {firstName}.",
    "We'll get back to you as soon as we can, typically within 3 business days.",
  ].join("\n\n"),
  ctaIntro: "In the meantime, lock the dates:",
  signoff: "Plug in.",
};

export interface EmailTemplateMeta {
  key: EmailTemplateKey;
  /** Short name — the tab label in the admin editor. */
  label: string;
  /** The public form this confirmation belongs to — the tab's second line. */
  flow: string;
  description: string;
  tokens: string[];
  defaults: EmailCopy;
  /** Sample values used for previews and test sends. */
  sample: TemplateVars;
}

// The one email here that is not a reply to something someone did: staff send
// it to every registrant from the admin, days before the week. Blocks, not
// prose — a list of desks, a list of garages, a line a day — so it can be read
// in the time it takes to find a parking space. Everything is the site's:
// badges and parking from lib/faq.ts, rooms from lib/locations.ts, the days
// from the schedule. When those change, change this.
//
// Dates, never "Monday" or "next week": it is re-sent to anyone who registers
// after the first send, and has to read right on the Wednesday too.
export const DEFAULT_KNOW_BEFORE_YOU_GO_COPY: EmailCopy = {
  subject: "Know before you go: San Antonio Startup + Tech Week",
  heading: "Know before you go.",
  body: [
    "Sept 28 – Oct 2, {firstName}.\nHere's what you need on the way in.",
    "## Badge pickup",
    "> Check in by name at any desk. Nothing to print — one badge works all week.",
    "Texas Public Radio | 321 W Commerce St\nThe Rand | 110 E Houston St, 3rd Floor\nCentral Library | 600 Soledad St",
    "## Parking",
    "City Tower | 60 N Flores St · $10 all day\nSt. Mary's Garage | 205 E Travis St · $10 all day\nHouston Street | 111 College St · $10 all day\nCentral Library | 600 Soledad St · 3 hrs free, then $5",
    "## The week",
    "Mon, Sept 28 | The Model · Mission Pitch\nTue, Sept 29 | Cup of Capital · founder & CPG talks at TPR · College Night\nWed, Sept 30 | 1 Million Cups · Access Granted · Latin Tech Pitch\nThu, Oct 1 | Texas Venture Fest · Startup Bash, 6 PM\nFri, Oct 2 | Give-a-LOT · PySanAntonio",
    "[See the full schedule](https://www.sasw.co/schedule)\n[Read the FAQ](https://www.sasw.co/faq)",
    "Questions? Reply to this email — a person reads every one.",
  ].join("\n\n"),
  // No calendar block: they registered, and the week is already in the
  // confirmation's. A blank intro drops the buttons with it (see renderEmail).
  ctaIntro: "",
  signoff: "See you downtown. Plug in.",
};

export const EMAIL_TEMPLATES: EmailTemplateMeta[] = [
  {
    key: "registration",
    label: "Registration",
    flow: "Register form",
    description: "Sent automatically when someone registers to attend.",
    tokens: ["{firstName}"],
    defaults: DEFAULT_REGISTRATION_COPY,
    sample: { firstName: "Alex" },
  },
  {
    key: "knowBeforeYouGo",
    label: "Know before you go",
    flow: "Send to registrants",
    description: "Badge pickup, parking and the week, sent by staff to every registrant.",
    tokens: ["{firstName}"],
    defaults: DEFAULT_KNOW_BEFORE_YOU_GO_COPY,
    sample: { firstName: "Alex" },
  },
  {
    key: "speaker",
    label: "Speaker",
    flow: "Plug In",
    description:
      "Sent automatically when someone pitches a session via Plug In.",
    tokens: ["{firstName}", "{sessionTitle}"],
    defaults: DEFAULT_SPEAKER_COPY,
    sample: { firstName: "Alex", sessionTitle: "Scaling AI at the edge" },
  },
  {
    key: "speakerAccepted",
    label: "Speaker accepted",
    flow: "Admin decision",
    description:
      "Sent when a submission's status is set to Accepted in the admin. The team follows up one-to-one to confirm the slot.",
    tokens: ["{firstName}", "{sessionTitle}"],
    defaults: DEFAULT_SPEAKER_ACCEPTED_COPY,
    sample: { firstName: "Alex", sessionTitle: "Scaling AI at the edge" },
  },
  {
    key: "speakerDeclined",
    label: "Speaker declined",
    flow: "Admin decision",
    description:
      "Sent when a submission's status is set to Declined in the admin.",
    tokens: ["{firstName}", "{sessionTitle}"],
    defaults: DEFAULT_SPEAKER_DECLINED_COPY,
    sample: { firstName: "Alex", sessionTitle: "Scaling AI at the edge" },
  },
  {
    key: "getInvolvedSponsor",
    label: "Sponsor",
    flow: "Get Involved",
    description:
      "Sent automatically when someone submits the Get Involved form on the sponsor path.",
    tokens: ["{firstName}"],
    defaults: DEFAULT_GET_INVOLVED_SPONSOR_COPY,
    sample: { firstName: "Alex" },
  },
  {
    key: "getInvolvedHost",
    label: "Host an event",
    flow: "Get Involved",
    description:
      "Sent automatically when someone proposes hosting an event during the week.",
    tokens: ["{firstName}"],
    defaults: DEFAULT_GET_INVOLVED_HOST_COPY,
    sample: { firstName: "Alex" },
  },
  {
    key: "getInvolvedGeneral",
    label: "General",
    flow: "Get Involved",
    description:
      "Sent automatically when someone submits a general question via Get Involved.",
    tokens: ["{firstName}"],
    defaults: DEFAULT_GET_INVOLVED_GENERAL_COPY,
    sample: { firstName: "Alex" },
  },
];

export function templateMeta(key: EmailTemplateKey): EmailTemplateMeta {
  const meta = EMAIL_TEMPLATES.find((t) => t.key === key);
  if (!meta) throw new Error(`Unknown email template: ${key}`);
  return meta;
}

/** Fill any missing/blank field from the defaults so a partial doc still renders. */
export function mergeCopy(
  defaults: EmailCopy,
  stored: Partial<EmailCopy> | undefined | null,
): EmailCopy {
  return {
    subject: pick(stored?.subject, defaults.subject),
    heading: pick(stored?.heading, defaults.heading),
    body: pick(stored?.body, defaults.body),
    // CTA intro + sign-off may be intentionally blanked, so only fall back when undefined.
    ctaIntro: stored?.ctaIntro ?? defaults.ctaIntro,
    signoff: stored?.signoff ?? defaults.signoff,
  };
}

function pick(value: string | undefined | null, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

// ─── Rendering (pure) ───────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text token substitution (for the subject line). */
function applyTokens(s: string, vars: TemplateVars): string {
  return s
    .replace(/\{firstName\}/g, vars.firstName)
    .replace(/\{sessionTitle\}/g, vars.sessionTitle ?? "");
}

function shell(bodyInner: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="background:${BLACK};padding:26px 28px;">
                <img src="${LOGO_URL}" width="240" height="60" alt="San Antonio Startup + Tech Week" style="display:block;border:0;outline:none;text-decoration:none;width:240px;height:60px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${bodyInner}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;color:${MUTED};font-size:12px;line-height:18px;">
                San Antonio Startup + Tech Week · Downtown at TPR<br/>
                The current runs through SA. Plug in.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<div style="font-size:26px;font-weight:700;line-height:1.1;color:${INK};margin:0 0 12px 0;">${text}</div>`;
}

function paragraph(text: string): string {
  return `<p style="font-size:15px;line-height:22px;color:${INK};margin:0 0 14px 0;">${text}</p>`;
}

// ─── Body blocks ────────────────────────────────────────────────────────────
// The body is written in the admin as plain text, one block per blank-line-
// separated paragraph. Plain paragraphs read as a wall in a logistics email —
// the know-before-you-go was one — so four markers turn a paragraph into
// something an eye can find without reading:
//
//   ## Badge pickup                 a section heading, magenta bar
//   The Rand | 110 E Houston St     one row per line: a boxed two-column list
//   > Free after 5 PM Thursday.     a highlighted tip
//   [See the schedule](https://…)   a button (one per line; several sit side by side)
//
// Anything else is a paragraph, and bare URLs in it become links. Tables and
// inline styles only: email clients drop <style> blocks and most CSS layout.

const RULE = "#e4e4e7";
const TINT = "#fff0f7"; // magenta at ~6% on white — the tip box ground

function sectionHead(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 12px 0;"><tr><td style="border-left:4px solid ${MAGENTA};padding:2px 0 2px 10px;font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${INK};">${text}</td></tr></table>`;
}

function rows(pairs: [string, string][]): string {
  const tr = pairs
    .map(
      ([label, value], i) =>
        `<tr><td style="padding:11px 14px;${i ? `border-top:1px solid ${RULE};` : ""}font-size:14px;line-height:20px;font-weight:700;color:${INK};width:42%;vertical-align:top;">${label}</td>` +
        `<td style="padding:11px 14px;${i ? `border-top:1px solid ${RULE};` : ""}font-size:14px;line-height:20px;color:${INK};vertical-align:top;">${value}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${RULE};border-radius:8px;border-collapse:separate;margin:0 0 14px 0;">${tr}</table>`;
}

function callout(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px 0;"><tr><td style="background:${TINT};border-left:4px solid ${MAGENTA};border-radius:0 8px 8px 0;padding:12px 14px;font-size:14px;line-height:20px;color:${INK};">${text}</td></tr></table>`;
}

function buttons(links: [string, string][]): string {
  const cells = links
    .map(
      ([label, href]) =>
        `<td style="padding:0 8px 0 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:${BLACK};"><a href="${href}" style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">${label}</a></td></tr></table></td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 16px 0;"><tr>${cells}</tr></table>`;
}

// Bare URLs to links, on text that is already escaped. `www.` gets a scheme so
// the href works; trailing punctuation stays outside the link.
function linkify(escaped: string): string {
  return escaped.replace(
    /\b((?:https?:\/\/|www\.)[^\s<]*[^\s<.,;:!?)])/g,
    (url) =>
      `<a href="${url.startsWith("www.") ? `https://${url}` : url}" style="color:${INK};font-weight:600;">${url}</a>`,
  );
}

const BUTTON_LINE = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/;

/** Turn admin-authored body text into safe block HTML with tokens applied. */
function renderBody(body: string, vars: TemplateVars): string {
  const first = escapeHtml(vars.firstName);
  const title = vars.sessionTitle
    ? `<strong>${escapeHtml(vars.sessionTitle)}</strong>`
    : "";
  // Escape, then fill tokens — the token values are escaped already.
  const text = (raw: string) =>
    escapeHtml(raw.trim())
      .replace(/\{firstName\}/g, first)
      .replace(/\{sessionTitle\}/g, title);

  return body
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);

      if (para.startsWith("## ")) return sectionHead(text(para.slice(3)));

      if (lines.every((l) => l.startsWith(">"))) {
        return callout(
          linkify(lines.map((l) => text(l.replace(/^>\s?/, ""))).join("<br/>")),
        );
      }

      if (lines.every((l) => BUTTON_LINE.test(l))) {
        return buttons(
          lines.map((l) => {
            const [, label, href] = l.match(BUTTON_LINE)!;
            return [text(label), escapeHtml(href)] as [string, string];
          }),
        );
      }

      if (lines.every((l) => l.includes(" | "))) {
        return rows(
          lines.map((l) => {
            const at = l.indexOf(" | ");
            return [
              text(l.slice(0, at)),
              linkify(text(l.slice(at + 3))),
            ] as [string, string];
          }),
        );
      }

      return paragraph(linkify(text(para)).replace(/\n/g, "<br/>"));
    })
    .join("");
}

// ─── Add-to-calendar block (locked) ─────────────────────────────────────────
// All-day, multi-day event (end date exclusive → Oct 3). Google is a
// self-contained link; Apple/Outlook use the hosted .ics file.
const CAL = {
  title: "San Antonio Startup + Tech Week",
  details: `Year 11. Five days, five circuits, one current. Sessions, the Bash, and where to be. ${SITE_URL}`,
  location: "Texas Public Radio, Downtown San Antonio",
  start: "20260928",
  endExclusive: "20261003",
  ics: `${SITE_URL}/sastw-2026.ics`,
};

const CAL_EVENT: CalendarEvent = {
  title: CAL.title,
  details: CAL.details,
  location: CAL.location,
  start: CAL.start,
  end: CAL.endExclusive,
  allDay: true,
};

function googleCalUrl(): string {
  return googleCalendarUrl(CAL_EVENT);
}

function outlookCalUrl(): string {
  // Outlook wants dashed dates for an all-day span, not the compact form the
  // .ics and Google use.
  return outlookCalendarUrl({
    ...CAL_EVENT,
    start: "2026-09-28",
    end: "2026-10-03",
  });
}

function calendarBlock(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:2px 0 8px 0;">
  <tr>
    <td style="border-radius:8px;background:${MAGENTA};">
      <a href="${googleCalUrl()}" style="display:inline-block;padding:12px 22px;color:${BLACK};font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Add to Google Calendar</a>
    </td>
  </tr>
</table>
<p style="font-size:13px;line-height:20px;color:${MUTED};margin:0 0 14px 0;">
  Another app? <a href="${CAL.ics}" style="color:${INK};font-weight:600;">Apple / Outlook (.ics)</a> &middot; <a href="${outlookCalUrl()}" style="color:${INK};font-weight:600;">Outlook.com</a>
</p>`;
}

// ─── Public render API ──────────────────────────────────────────────────────

/** Render any template from its copy + variables. Used by sends and previews. */
export function renderEmail(
  copy: EmailCopy,
  vars: TemplateVars,
): { subject: string; html: string } {
  const ctaIntro = copy.ctaIntro.trim()
    ? paragraph(escapeHtml(applyTokens(copy.ctaIntro, vars)))
    : "";
  const signoff = copy.signoff.trim()
    ? paragraph(escapeHtml(applyTokens(copy.signoff, vars)))
    : "";
  return {
    subject: applyTokens(copy.subject, vars).trim(),
    html: shell(
      heading(escapeHtml(applyTokens(copy.heading, vars))) +
        renderBody(copy.body, vars) +
        ctaIntro +
        // Tied to the intro rather than always drawn: a template that clears
        // `ctaIntro` gets no calendar block either, instead of an unlabelled
        // pair of buttons under its last line.
        (copy.ctaIntro.trim() ? calendarBlock() : "") +
        signoff,
    ),
  };
}

/** Render a template by key using its sample vars (preview / test send). */
export function renderSample(
  key: EmailTemplateKey,
  copy: EmailCopy,
): { subject: string; html: string } {
  return renderEmail(copy, templateMeta(key).sample);
}

const firstNameOf = (name: string) => name.split(" ")[0] || name;

// Backward-compatible entry points. The API routes pass the admin-edited copy
// loaded from Firestore; callers without copy get the in-code defaults.
export function registrationEmail(
  input: { name: string },
  copy: EmailCopy = DEFAULT_REGISTRATION_COPY,
): { subject: string; html: string } {
  return renderEmail(copy, { firstName: firstNameOf(input.name) });
}

export function speakerSubmissionEmail(
  input: { name: string; sessionTitle: string },
  copy: EmailCopy = DEFAULT_SPEAKER_COPY,
): { subject: string; html: string } {
  return renderEmail(copy, {
    firstName: firstNameOf(input.name),
    sessionTitle: input.sessionTitle,
  });
}

// ─── Internal team notification (not admin-editable) ───────────────────────
// A plain field rundown sent to the SASTW team when a Get Involved submission
// lands. Reuses the brand shell; content is just label/value rows.

export function internalNotificationEmail(input: {
  title: string;
  fields: { label: string; value: string | undefined }[];
}): { subject: string; html: string } {
  const rows = input.fields
    .filter((f) => f.value && f.value.trim())
    .map(
      (f) => `
<tr>
  <td style="padding:6px 12px 6px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${MUTED};vertical-align:top;white-space:nowrap;">${escapeHtml(f.label)}</td>
  <td style="padding:6px 0;font-size:14px;line-height:20px;color:${INK};vertical-align:top;">${escapeHtml(f.value!).replace(/\n/g, "<br/>")}</td>
</tr>`,
    )
    .join("");
  return {
    subject: input.title,
    html: shell(
      heading(escapeHtml(input.title)) +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${rows}</table>`,
    ),
  };
}

/** Know before you go, for one registrant. Used by the send-to-all action. */
export function knowBeforeYouGoEmail(
  input: { name: string },
  copy: EmailCopy = DEFAULT_KNOW_BEFORE_YOU_GO_COPY,
): { subject: string; html: string } {
  return renderEmail(copy, { firstName: firstNameOf(input.name) });
}
