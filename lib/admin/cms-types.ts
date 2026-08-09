// Client-safe CMS types. Timestamps serialized to epoch millis.

import type { TrackName } from "@/lib/tracks";

export type ParticipantRole = "speaker" | "moderator";

// Partners and sponsors share the same shape: image, name, link.
export interface LogoEntityRow {
  id: string;
  name: string;
  imageUrl: string;
  link: string;
  scale?: number; // per-logo size multiplier on the wall (1 = default)
  createdAt: number;
}

export interface SpeakerRow {
  id: string;
  /** URL segment for /speakers/[slug]. Stable across renames. */
  slug: string;
  /** Slugs this speaker used to answer to — kept so old links redirect. */
  previousSlugs: string[];
  name: string;
  /** Role — "Founder", "CTO". Empty until an admin fills it in. */
  title: string;
  /** Org the role belongs to. Empty until an admin fills it in. */
  company: string;
  imageUrl: string;
  bio: string;
  linkedin: string;
  createdAt: number;
}

export interface SessionParticipant {
  speakerId: string;
  role: ParticipantRole;
}

// A participant resolved with the speaker's display name (for rendering).
export interface ResolvedParticipant extends SessionParticipant {
  name: string;
  imageUrl?: string;
}

export interface SessionRow {
  id: string;
  title: string;
  description: string;
  startsAt: number;
  endsAt: number | null;
  /** A room slug from lib/locations. Legacy rows may hold free text. */
  location: string;
  track: string | null;
  /**
   * The activation this runs inside, as its page slug — or null for a session
   * that stands on its own in the week.
   */
  activation: string | null;
  participants: ResolvedParticipant[];
  createdAt: number;
}

// ─── Public lineup ──────────────────────────────────────────────────────────
// A speaker as the public surfaces need them: the CMS row plus the circuits
// and sessions inverted out of the schedule. Lives here rather than beside
// the loader so client components can import the type without pulling a
// server-only module into their graph.

export interface LineupSession {
  id: string;
  title: string;
  startsAt: number;
  location: string;
  track: string | null;
  /** Activation slug this belongs to, so a speaker's page can link to it. */
  activation: string | null;
}

export interface LineupSpeaker extends SpeakerRow {
  circuits: TrackName[];
  sessions: LineupSession[];
}

// The CMS entities, used for routing + labels.
export type CmsEntity = "partners" | "sponsors" | "speakers" | "sessions";
