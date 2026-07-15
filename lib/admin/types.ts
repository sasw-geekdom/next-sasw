// Client-safe types shared between server queries and client tables.
// No server-only / firebase-admin imports here.

export type SubmissionStatus = "new" | "reviewing" | "accepted" | "declined";

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "new",
  "reviewing",
  "accepted",
  "declined",
];

// Firestore Timestamps are serialized to epoch millis before crossing to the client.
export interface SpeakerSubmissionRow {
  id: string;
  name: string;
  email: string;
  company?: string;
  track: string;
  sessionTitle: string;
  abstract: string;
  bio: string;
  website?: string;
  linkedin?: string;
  availability?: string;
  headshotUrl?: string;
  status: SubmissionStatus;
  promotedSpeakerId?: string | null;
  createdAt: number;
}

export interface RegistrationRow {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  interest?: string;
  checkedIn: boolean;
  checkedInAt: number | null;
  checkedInBy: string | null;
  createdAt: number;
}

export interface VolunteerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  availability: string;
  interests: string[];
  notes?: string;
  status: SubmissionStatus;
  createdAt: number;
}

export interface SponsorLeadRow {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  website?: string;
  level: string;
  message?: string;
  status: SubmissionStatus;
  createdAt: number;
}
