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
};

export interface CircuitSponsor {
  circuit: string;
  name: string;
  imageUrl: string;
  link: string;
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
    imageUrl: row.imageUrl,
    link: row.link,
  };
}
