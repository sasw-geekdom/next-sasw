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
  /**
   * The speaker's own page, where they have one.
   *
   * Empty when the id no longer resolves — a session keeps a participant whose
   * speaker doc was deleted, and a talk page that printed "Unknown speaker" as
   * a link would be a dead one.
   */
  slug: string;
}

export interface SessionRow {
  id: string;
  /**
   * The public URL segment, for a session that stands on its own.
   *
   * Stored once an admin has saved the session; derived from the title at read
   * time before that, which is how the speakers collection backfilled its own.
   * A derived slug is provisional — the next save promotes it to stored, and
   * that is what makes it safe to link to.
   *
   * Sessions inside an activation carry one too and simply don't use it: the
   * activation page is their home, and giving them a second URL would split
   * content that page deliberately gathers.
   */
  slug: string;
  /**
   * Slugs this session has published under and moved off.
   *
   * A talk's URL is derived from its title, and titles get edited — the first
   * one on the site was retitled within a day of going up, which moved its
   * slug and 404'd the URL that had already been shared. Retiring rather than
   * dropping lets the route redirect, exactly as a renamed speaker does.
   */
  previousSlugs: string[];
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
  /** The talk's own URL segment, for a session with no activation. */
  slug: string;
  title: string;
  startsAt: number;
  location: string;
  track: string | null;
  /** Activation slug this belongs to, so a speaker's page can link to it. */
  activation: string | null;
}

export interface LineupSpeaker extends SpeakerRow {
  circuits: TrackName[];
  /**
   * Activation slugs this speaker appears in, and venue slugs they appear at.
   *
   * Derived from their sessions exactly as `circuits` is — no speaker is ever
   * tagged with a room or an event by hand. That keeps a speaker's filters
   * true by construction: move a session to another venue in the CMS and the
   * speaker moves with it.
   */
  activations: string[];
  venues: string[];
  sessions: LineupSession[];
}

// The CMS entities, used for routing + labels.
export type CmsEntity = "partners" | "sponsors" | "speakers" | "sessions";
