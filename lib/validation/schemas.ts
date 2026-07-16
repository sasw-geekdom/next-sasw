import { z } from "zod";
import { TRACK_NAMES } from "@/lib/tracks";
import {
  DESCRIBES_YOU,
  INDUSTRIES,
  SA_TENURE,
  VOLUNTEER_DAYS,
} from "@/lib/registration";
import { BUDGET_RANGES, VENUE_STATUS, HEARD_ABOUT } from "@/lib/get-involved";

// Shared field pieces.
const email = z.string().trim().toLowerCase().email("Enter a valid email.");
const name = z.string().trim().min(2, "Name is required.").max(120);
const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .max(300)
  .optional()
  .or(z.literal("").transform(() => undefined));

// ─── Call for Speakers ──────────────────────────────────────────────────────
export const speakerSubmissionSchema = z.object({
  name,
  email,
  company: z.string().trim().min(2, "Company or project is required.").max(160),
  track: z.enum(TRACK_NAMES, { message: "Pick a track." }),
  sessionTitle: z.string().trim().min(4, "Give your session a title.").max(160),
  abstract: z
    .string()
    .trim()
    .min(40, "Tell us a little more — 40 characters minimum.")
    .max(2000),
  bio: z.string().trim().min(20, "Add a short bio.").max(1500),
  linkedin: z.string().trim().url("Enter a valid LinkedIn URL.").max(300),
  availability: z
    .string()
    .trim()
    .min(2, "Let us know your availability.")
    .max(500),
  website: optionalUrl,
});

export type SpeakerSubmissionInput = z.infer<typeof speakerSubmissionSchema>;

// ─── Registration ───────────────────────────────────────────────────────────
// Optional single-selects arrive as "" when untouched — normalize to undefined.
const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .enum(values)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const registrationSchema = z.object({
  // Required
  name,
  email,
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Enter a 5-digit ZIP code."),

  // Optional — About you
  describesYou: optionalChoice(DESCRIBES_YOU),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  industry: optionalChoice(INDUSTRIES),
  saTenure: optionalChoice(SA_TENURE),

  // Optional — Your week
  circuits: z.array(z.enum(TRACK_NAMES)).max(TRACK_NAMES.length).default([]),
  firstTime: z.boolean().optional(),

  // Optional — Volunteering
  volunteerInterested: z.boolean().optional(),
  volunteerDays: z.array(z.enum(VOLUNTEER_DAYS)).max(5).default([]),
  volunteerNotes: z.string().trim().max(500).optional().or(z.literal("")),

  // Sponsor consent (default unchecked)
  sponsorConsent: z.boolean().default(false),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

// ─── Get Involved ───────────────────────────────────────────────────────────
// One form, three routed paths (sponsor / host / general). Section 1 contact
// fields are required for every path; Section 3 varies by path; Section 4
// wrap-up is shared and optional.
const getInvolvedBase = {
  name,
  email,
  phone: z.string().trim().min(7, "Phone is required.").max(40),
  company: z
    .string()
    .trim()
    .min(2, "Company or organization is required.")
    .max(160),
  role: z.string().trim().min(2, "What's your role?").max(120),
  heardAbout: z
    .enum(HEARD_ABOUT)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
};

export const getInvolvedSchema = z.discriminatedUnion("path", [
  z.object({
    path: z.literal("sponsor"),
    ...getInvolvedBase,
    anchorEvent: z.string().trim().max(200).optional().or(z.literal("")),
    goals: z.string().trim().max(2000).optional().or(z.literal("")),
    budget: z.enum(BUDGET_RANGES, { message: "Pick a ballpark range." }),
  }),
  z.object({
    path: z.literal("host"),
    ...getInvolvedBase,
    eventConcept: z
      .string()
      .trim()
      .min(20, "Tell us about the event — working title, format, concept.")
      .max(3000),
    audience: z
      .array(z.enum(TRACK_NAMES))
      .min(1, "Pick at least one circuit.")
      .max(TRACK_NAMES.length),
    attendance: z.string().trim().max(80).optional().or(z.literal("")),
    preferredTime: z.string().trim().max(200).optional().or(z.literal("")),
    venue: z.enum(VENUE_STATUS, { message: "Let us know about the venue." }),
    coSponsors: z.string().trim().max(2000).optional().or(z.literal("")),
  }),
  z.object({
    path: z.literal("general"),
    ...getInvolvedBase,
    question: z.string().trim().min(5, "What's your question?").max(3000),
  }),
]);
export type GetInvolvedInput = z.infer<typeof getInvolvedSchema>;

// ─── CMS ────────────────────────────────────────────────────────────────────
const url = z.string().trim().url("Enter a valid URL.").max(500);

// Partners + sponsors.
export const logoEntitySchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(160),
  link: url,
});
export type LogoEntityInput = z.infer<typeof logoEntitySchema>;

export const speakerSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(160),
  bio: z.string().trim().min(10, "Add a short bio.").max(2000),
  linkedin: url,
});
export type SpeakerInput = z.infer<typeof speakerSchema>;

const participant = z.object({
  speakerId: z.string().trim().min(1),
  role: z.enum(["speaker", "moderator"]),
});

export const sessionSchema = z.object({
  title: z.string().trim().min(3, "Give the session a title.").max(200),
  description: z.string().trim().min(10, "Add a description.").max(3000),
  // ISO strings from <input type="datetime-local">, converted to Date.
  startsAt: z.coerce.date({ message: "Pick a start date and time." }),
  endsAt: z.coerce.date().optional().nullable(),
  location: z.string().trim().min(2, "Where's it happening?").max(200),
  track: z
    .enum(TRACK_NAMES)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  participants: z.array(participant).default([]),
});
export type SessionInput = z.infer<typeof sessionSchema>;

// ─── Automated email copy (admin-editable) ──────────────────────────────────

export const emailCopySchema = z.object({
  subject: z.string().trim().min(1, "Subject is required.").max(160),
  heading: z.string().trim().min(1, "Heading is required.").max(120),
  body: z.string().trim().min(1, "Body is required.").max(4000),
  ctaIntro: z.string().trim().max(200),
  signoff: z.string().trim().max(120),
});
export type EmailCopyInput = z.infer<typeof emailCopySchema>;
