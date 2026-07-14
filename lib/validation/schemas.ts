import { z } from "zod";
import { TRACK_NAMES } from "@/lib/tracks";

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
export const registrationSchema = z.object({
  name,
  email,
  company: z.string().trim().min(2, "Company or project is required.").max(160),
  role: z.string().trim().min(2, "What's your role?").max(120),
  interest: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

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
