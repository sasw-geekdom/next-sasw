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
  sessionTitle: string;
  abstract: string;
  bio: string;
  website?: string;
  linkedin?: string;
  availability?: string;
  headshotUrl?: string;
  status: SubmissionStatus;
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
