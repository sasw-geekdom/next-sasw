/**
 * Trimmed-to-ink copies of sponsor marks that arrive from the CMS padded.
 *
 * Sponsors send artwork with whatever margin their brand sheet specifies, and
 * both of ours do: measured at a 32px render, the Google for Startups mark
 * carries 12.8px of transparent padding down its left edge and Nopalera 8.5px.
 * Inside an image box that padding is invisible and load-bearing — it is space
 * no `gap` can close, because it is not gap, and it defeats `items-center`,
 * which can only centre the box it is handed rather than the ink inside it.
 *
 * So the layout gets a box that *is* the ink. The CMS row still decides
 * whether a sponsor appears at all and where its link goes — the bargain
 * `circuitSponsor` and the partner walls make — and only the picture is
 * swapped, for the marks we have a trimmed copy of.
 *
 * Re-trim the same way if a sponsor sends new artwork, or drop the entry and
 * take the padding back. A name with no entry here passes straight through.
 */
const TRIMMED: Readonly<Record<string, string>> = {
  Nopalera: "/brand/nopalera-wordmark.png",
  "Google for Startups": "/brand/google-for-startups-wordmark.png",
};

/** The trimmed cut of a sponsor's mark, or the CMS one when there isn't one. */
export function sponsorMark(name: string, cmsUrl: string): string {
  return TRIMMED[name.trim()] ?? cmsUrl;
}
