// Client-safe CMS types. Timestamps serialized to epoch millis.

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
  name: string;
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
  location: string;
  track: string | null;
  participants: ResolvedParticipant[];
  createdAt: number;
}

// The CMS entities, used for routing + labels.
export type CmsEntity = "partners" | "sponsors" | "speakers" | "sessions";
