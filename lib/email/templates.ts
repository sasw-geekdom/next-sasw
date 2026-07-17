// Branded transactional emails in SASTW voice. Terse, active, one metaphor.
// Inline styles only — email clients don't load external CSS or web fonts.
//
// The COPY (subject, heading, body, CTA intro, sign-off) is editable by admins
// in the portal and stored in Firestore; the brand chrome (logo header,
// calendar block, footer) is locked here. This module is PURE — no server-only
// deps — so the same render functions drive the live preview in the browser.

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
  /** Blank-line-separated paragraphs. Supports {firstName} and {sessionTitle}. */
  body: string;
  /** Line shown just above the add-to-calendar block. Blank to omit. */
  ctaIntro: string;
  /** Closing line. Blank to omit. */
  signoff: string;
}

export type EmailTemplateKey =
  | "registration"
  | "speaker"
  | "getInvolvedSponsor"
  | "getInvolvedHost"
  | "getInvolvedGeneral";

export interface TemplateVars {
  firstName: string;
  sessionTitle?: string;
}

export const DEFAULT_REGISTRATION_COPY: EmailCopy = {
  subject: "You're on the list. Plug in.",
  heading: "You're in.",
  body: [
    "See you downtown, {firstName}.",
    "San Antonio Startup + Tech Week runs Sept 28 – Oct 2, anchored at Texas Public Radio.",
    "Schedule drops soon. We'll send the sessions, the Bash, and where to be.",
  ].join("\n\n"),
  ctaIntro: "Lock the dates now:",
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
    key: "speaker",
    label: "Speaker",
    flow: "Plug In",
    description: "Sent automatically when someone pitches a session via Plug In.",
    tokens: ["{firstName}", "{sessionTitle}"],
    defaults: DEFAULT_SPEAKER_COPY,
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

/** Turn admin-authored body text into safe paragraph HTML with tokens applied. */
function renderBody(body: string, vars: TemplateVars): string {
  const first = escapeHtml(vars.firstName);
  const title = vars.sessionTitle
    ? `<strong>${escapeHtml(vars.sessionTitle)}</strong>`
    : "";
  return body
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const safe = escapeHtml(para)
        .replace(/\{firstName\}/g, first)
        .replace(/\{sessionTitle\}/g, title)
        .replace(/\n/g, "<br/>");
      return paragraph(safe);
    })
    .join("");
}

// ─── Add-to-calendar block (locked) ─────────────────────────────────────────
// All-day, multi-day event (end date exclusive → Oct 3). Google is a
// self-contained link; Apple/Outlook use the hosted .ics file.
const CAL = {
  title: "San Antonio Startup + Tech Week",
  details:
    "Year 11. Five days, five circuits, one current. Sessions, the Bash, and where to be. https://sasw.co",
  location: "Texas Public Radio, Downtown San Antonio",
  start: "20260928",
  endExclusive: "20261003",
  ics: "https://sasw.co/sastw-2026.ics",
};

function googleCalUrl(): string {
  const e = encodeURIComponent;
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${e(CAL.title)}` +
    `&dates=${CAL.start}/${CAL.endExclusive}` +
    `&details=${e(CAL.details)}` +
    `&location=${e(CAL.location)}`
  );
}

function outlookCalUrl(): string {
  const e = encodeURIComponent;
  return (
    "https://outlook.live.com/calendar/0/action/compose?rru=addevent&allday=true" +
    `&subject=${e(CAL.title)}` +
    "&startdt=2026-09-28&enddt=2026-10-03" +
    `&location=${e(CAL.location)}` +
    `&body=${e(CAL.details)}`
  );
}

function calendarBlock(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:2px 0 8px 0;">
  <tr>
    <td style="border-radius:8px;background:${MAGENTA};">
      <a href="${googleCalUrl()}" style="display:inline-block;padding:12px 22px;color:${BLACK};font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Add to Google Calendar &rarr;</a>
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
        calendarBlock() +
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
