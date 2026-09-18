import { sponsorMark } from "@/lib/sponsor-marks";
import type { TrackName } from "@/lib/tracks";

/**
 * Circuits with a sponsor behind them.
 *
 * Keyed by circuit and matched to the `sponsors` collection by name, so a
 * replaced logo or a changed link lands here without a deploy — the same
 * bargain the partner walls make.
 *
 * Deliberately not a colour or a badge. The circuits do not get their own
 * palettes (see the note on CIRCUIT_COLORS in lib/tracks.ts), and a sponsor
 * does not get to be the exception — this is a credit line with a mark, in
 * the register the "powered by" walls already use.
 */
export const CIRCUIT_SPONSORS: Partial<Record<TrackName, string>> = {
  Founder: "Nopalera",
  "Tech & Builders": "Google for Startups",
  "AI & Applied Innovation": "Webhead",
};

/**
 * A sponsor's own line about the circuit it backs, where it asked for one.
 *
 * Webhead did, and it is the first: the other two take the credit line as it
 * stands. Optional on purpose — a sponsor gets a mark by being in the map
 * above, and a sentence only by having something to say. A line here is the
 * sponsor's words, not ours, so it goes in verbatim.
 *
 * It renders under the credit rather than beside it, in the same muted
 * register: this is a footnote to a circuit, and a sentence set at the size
 * of the page's own copy would read as the activation's blurb.
 */
export const CIRCUIT_SPONSOR_NOTES: Partial<Record<TrackName, string>> = {
  "AI & Applied Innovation":
    "Powering the deep tech and emerging technology conversation at SASTW — AI, cyber, quantum, and what's coming next.",
};

export interface CircuitSponsor {
  circuit: string;
  name: string;
  imageUrl: string;
  link: string;
  /** The sponsor's own line about the circuit, where it has one. */
  note?: string;
}

/**
 * Resolve a circuit's sponsor against the sponsor rows.
 *
 * Takes the rows rather than fetching them, so this file stays free of
 * `server-only` and can be imported from anywhere — same shape as
 * `giveALotOrganizers`. Returns null for a circuit with no sponsor, and for a
 * sponsor whose row has gone missing: a credit line with no mark under it
 * reads as a mistake.
 */
export function circuitSponsor(
  // Nullable as well as optional: a CMS session's `track` is `string | null`
  // where an activation's `circuit` is always set.
  circuit: string | null | undefined,
  sponsors: readonly { name: string; imageUrl: string; link: string }[],
): CircuitSponsor | null {
  if (!circuit) return null;
  const want = CIRCUIT_SPONSORS[circuit as TrackName];
  if (!want) return null;
  const row = sponsors.find(
    (s) => s.name.trim().toLowerCase() === want.toLowerCase(),
  );
  if (!row?.imageUrl) return null;
  return {
    circuit,
    name: row.name,
    // The trimmed cut where we have one — see `sponsorMark`. The row still
    // decides whether this sponsor appears and where it points.
    imageUrl: sponsorMark(row.name, row.imageUrl),
    link: row.link,
    note: CIRCUIT_SPONSOR_NOTES[circuit as TrackName],
  };
}
