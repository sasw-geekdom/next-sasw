import "server-only";

import type { Timestamp } from "firebase-admin/firestore";
import type { Role } from "@/lib/auth/roles";
import type { SubmissionStatus } from "@/lib/admin/types";
import type { SessionParticipant } from "@/lib/admin/cms-types";
import type { TrackName } from "@/lib/tracks";

export type { SubmissionStatus };

// Central registry of Firestore collection names — one place to rename.
export const COLLECTIONS = {
  speakerSubmissions: "speakerSubmissions",
  registrations: "registrations",
  volunteers: "volunteers",
  sponsorLeads: "sponsorLeads",
  getInvolved: "getInvolved",
  speakers: "speakers",
  sessions: "sessions",
  sponsors: "sponsors",
  partners: "partners",
  staff: "staff",
  settings: "settings",
} as const;

// Doc id within the `settings` collection holding admin-edited email copy.
export const EMAIL_SETTINGS_DOC = "emails";

// Doc id within `settings` holding the 15-years gallery thumbnail manifest.
export const GALLERY_SETTINGS_DOC = "gallery";

export interface SpeakerSubmissionDoc {
  name: string;
  email: string;
  company?: string;
  track: TrackName;
  sessionTitle: string;
  abstract: string;
  bio: string;
  website?: string;
  linkedin?: string;
  availability?: string;
  headshotUrl?: string;
  status: SubmissionStatus;
  promotedSpeakerId?: string | null;
  createdAt: Timestamp;
}

export interface RegistrationDoc {
  // Required
  name: string;
  email: string;
  zip: string;
  // Optional — About you
  describesYou?: string;
  company?: string;
  role?: string;
  industry?: string;
  saTenure?: string;
  // Optional — Your week
  circuits: TrackName[];
  firstTime?: boolean;
  // Optional — Volunteering (filtered view/tag in admin)
  volunteerInterested?: boolean;
  volunteerDays: string[];
  volunteerNotes?: string;
  // Sponsor consent (filtered view/tag in admin)
  sponsorConsent: boolean;
  // Check-in
  checkedIn: boolean;
  checkedInAt: Timestamp | null;
  checkedInBy: string | null;
  createdAt: Timestamp;
}

export interface VolunteerDoc {
  name: string;
  email: string;
  phone?: string;
  availability: string;
  interests: string[];
  notes?: string;
  status: SubmissionStatus;
  createdAt: Timestamp;
}

export interface SponsorLeadDoc {
  name: string;
  email: string;
  company: string;
  role: string;
  website?: string;
  level: string;
  message?: string;
  status: SubmissionStatus;
  createdAt: Timestamp;
}

// Get Involved — one collection, three routed paths. Stored flat; only the
// fields for the submitted path are present.
export interface GetInvolvedDoc {
  path: "sponsor" | "host" | "general";
  // Section 1 — contact (always present)
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  // Section 3A — sponsor
  anchorEvent?: string;
  goals?: string;
  budget?: string;
  // Section 3B — host
  eventConcept?: string;
  audience?: TrackName[];
  attendance?: string;
  preferredTime?: string;
  venue?: string;
  coSponsors?: string;
  // Section 3C — general
  question?: string;
  // Section 4 — wrap-up
  heardAbout?: string;
  notes?: string;
  status: SubmissionStatus;
  createdAt: Timestamp;
}

export interface StaffDoc {
  email: string;
  role: Role;
  createdAt: Timestamp;
}

// Partners + sponsors share this shape.
export interface LogoEntityDoc {
  name: string;
  imageUrl: string;
  link: string;
  order?: number; // admin drag order; new docs get Date.now() → sort last
  createdAt: Timestamp;
}

export interface SpeakerDoc {
  name: string;
  imageUrl: string;
  bio: string;
  linkedin: string;
  order?: number; // admin drag order; new docs get Date.now() → sort last
  createdAt: Timestamp;
}

export interface SessionDoc {
  title: string;
  description: string;
  startsAt: Timestamp;
  endsAt: Timestamp | null;
  location: string;
  track: TrackName | null;
  participants: SessionParticipant[];
  createdAt: Timestamp;
}
