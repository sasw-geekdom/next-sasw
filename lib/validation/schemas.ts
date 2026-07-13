import { z } from "zod";

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
  company: z.string().trim().max(160).optional().or(z.literal("")),
  sessionTitle: z.string().trim().min(4, "Give your session a title.").max(160),
  abstract: z
    .string()
    .trim()
    .min(40, "Tell us a little more — 40 characters minimum.")
    .max(2000),
  bio: z.string().trim().min(20, "Add a short bio.").max(1500),
  website: optionalUrl,
  linkedin: optionalUrl,
  availability: z.string().trim().max(500).optional().or(z.literal("")),
});

export type SpeakerSubmissionInput = z.infer<typeof speakerSubmissionSchema>;

// ─── Registration ───────────────────────────────────────────────────────────
export const registrationSchema = z.object({
  name,
  email,
  company: z.string().trim().max(160).optional().or(z.literal("")),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  interest: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
