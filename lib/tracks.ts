/**
 * San Antonio Startup + Tech Week speaker tracks — names and audience
 * descriptions. Single source of truth, shared by the Call for Speakers form,
 * the sessions CMS, and (later) the public schedule.
 */

export const TRACK_NAMES = [
  "Founder",
  "Tech & Builders",
  "AI & Applied Innovation",
  "Small Business & Solopreneur",
  "Capital",
] as const;

export type TrackName = (typeof TRACK_NAMES)[number];

export interface Track {
  name: TrackName;
  description: string;
}

export const TRACKS: Track[] = [
  {
    name: "Founder",
    description: "Early-stage startup founders, pre-seed to Series A.",
  },
  {
    name: "Tech & Builders",
    description: "Engineers, devs, technical talent, CS students.",
  },
  {
    name: "AI & Applied Innovation",
    description: "Anyone integrating AI into work or product.",
  },
  {
    name: "Small Business & Solopreneur",
    description: "Owners, CPG, food, services, freelancers.",
  },
  {
    name: "Capital",
    description: "Investors, ecosystem builders, corporates, philanthropy.",
  },
];

export function trackByName(name: string | undefined | null): Track | undefined {
  return TRACKS.find((t) => t.name === name);
}

// Circuit accent colors for the bolt shader — a magenta-anchored spectrum
// chosen to read well as flowing "current." A UI accent, not brand track data.
export const CIRCUIT_COLORS: Record<TrackName, string> = {
  Founder: "#ff32a0",
  "Tech & Builders": "#4d7cff",
  "AI & Applied Innovation": "#19c8c8",
  "Small Business & Solopreneur": "#b45cff",
  Capital: "#ff6b57",
};

export const DEFAULT_CIRCUIT_COLOR = "#ff32a0";
