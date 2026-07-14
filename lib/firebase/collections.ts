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
  name: string;
  email: string;
  company?: string;
  role?: string;
  interest?: string;
  checkedIn: boolean;
  checkedInAt: Timestamp | null;
  checkedInBy: string | null;
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
  createdAt: Timestamp;
}

export interface SpeakerDoc {
  name: string;
  imageUrl: string;
  bio: string;
  linkedin: string;
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
