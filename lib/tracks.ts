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

/**
 * An even sRGB blend of two circuits — the midpoint the eye expects.
 *
 * Used to give a page's hero bolt its own charge without inventing a colour
 * outside the system: /sessions runs Tech & Builders × AI & Applied
 * Innovation, /speakers runs Small Business × Capital. Derived rather than
 * pasted, so retuning a circuit moves every bolt built from it.
 *
 * A literal is unavoidable at the WebGL boundary — a shader uniform can't read
 * a CSS custom property — which is why this returns hex rather than a token.
 */
export function mixCircuits(a: TrackName, b: TrackName): string {
  const channel = (hex: string, i: number) =>
    parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mid = [0, 1, 2].map((i) =>
    Math.round((channel(CIRCUIT_COLORS[a], i) + channel(CIRCUIT_COLORS[b], i)) / 2),
  );
  return `#${mid.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
