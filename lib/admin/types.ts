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
  /**
   * Attended at least one day. Kept alongside `checkedInDays` because it is
   * what the attendance rate and the registrations filter mean by "checked in",
   * and because every row written before per-day check-in existed has only this.
   */
  checkedIn: boolean;
  /** Most recent check-in, not the first — it is what "Recent" is sorted on. */
  checkedInAt: number | null;
  checkedInBy: string | null;
  /**
   * Which event days this person actually turned up for, as `YYYY-MM-DD`.
   *
   * The week is five separate events and people come to some and not others, so
   * one boolean could not describe attendance: somebody checked in on the
   * Monday was permanently "in" and could not be checked in again on the
   * Thursday, and the by-day counts credited everyone to whichever day they
   * first appeared. Days 2 to 5 therefore read close to zero however busy they
   * were.
   *
   * Empty on rows written before this existed; the door falls back to
   * `checkedInAt` for those, which is the day they came.
   */
  checkedInDays: string[];
  createdAt: number;
  /**
   * How this record came to exist. Absent for the 274 who filled in the public
   * form; "door" for someone added at check-in, which is the only way to tell a
   * walk-up apart from a pre-registration afterwards.
   */
  source?: "door";
  /** Set at the door for anyone who is not a plain attendee. */
  attendeeType?: AttendeeType;
}

/**
 * What somebody is, when it is not "attendee".
 *
 * Recorded only at the door. The public form does not ask — a speaker or a
 * sponsor who registers through the site is an attendee like anyone else, and
 * this exists so the person on the door can say who walked up without inventing
 * a second collection for them.
 */
export const ATTENDEE_TYPES = [
  "attendee",
  "speaker",
  "sponsor",
  "volunteer",
  "staff",
  "press",
] as const;

export type AttendeeType = (typeof ATTENDEE_TYPES)[number];

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
