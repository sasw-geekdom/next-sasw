import "server-only";

import type { Timestamp } from "firebase-admin/firestore";
import type { Role } from "@/lib/auth/roles";
import type { SubmissionStatus } from "@/lib/admin/types";

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
} as const;

export interface SpeakerSubmissionDoc {
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
