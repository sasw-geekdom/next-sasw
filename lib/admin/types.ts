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
  zip?: string;
  describesYou?: string;
  company?: string;
  role?: string;
  industry?: string;
  saTenure?: string;
  circuits: string[];
  firstTime?: boolean;
  volunteerInterested?: boolean;
  volunteerDays: string[];
  volunteerNotes?: string;
  sponsorConsent: boolean;
  checkedIn: boolean;
  checkedInAt: number | null;
  checkedInBy: string | null;
  createdAt: number;
}

export interface GetInvolvedRow {
  id: string;
  path: "sponsor" | "host" | "general";
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  anchorEvent?: string;
  goals?: string;
  budget?: string;
  eventConcept?: string;
  audience: string[];
  attendance?: string;
  preferredTime?: string;
  venue?: string;
  coSponsors?: string;
  question?: string;
  heardAbout?: string;
  notes?: string;
  status: SubmissionStatus;
  createdAt: number;
}

