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
  /**
   * Both halves of the lockup, with the lines that can't survive it removed.
   *
   * Webhead's artwork is a dual lockup — the Webhead wordmark, a divider, and
   * Quantum Realm Computing — because they are one company, so both marks
   * stay. The colour version does not: its left half is navy, which on this
   * site's black is a hole. This is the white cut.
   *
   * What came off is only the type that could not be read at any height this
   * line will ever draw: "people + technology + real-world impact" under the
   * wordmark, "A Webhead Division" under Quantum Realm, and the "innovation
   * built for what's next" line floating above the rule. All three are 6px
   * tall in a 132px file; at the render height below they would be under a
   * pixel, which is not small type but grey noise around two marks.
   */
  Webhead: "/brand/webhead-quantum-lockup.png",
};

/** The trimmed cut of a sponsor's mark, or the CMS one when there isn't one. */
export function sponsorMark(name: string, cmsUrl: string): string {
  return TRIMMED[name.trim()] ?? cmsUrl;
}

/**
 * How tall to draw a mark, for the ones a single height is wrong for.
 *
 * The default is one line of ink and the numbers work out: a trimmed
 * single-line wordmark at 16px tall lands around 140px wide, which is the
 * width this credit wants beside an 11px label.
 *
 * Webhead's is three lines of ink — wordmark, divider, and a three-deep
 * Quantum Realm stack — so height and width come apart. Matched on height it
 * would draw 92px wide with two of its three Quantum Realm lines illegible;
 * matched on *width* it lands at 28–32px tall, 161–184px wide, and every word
 * in it reads. Width is what the eye compares along a row, so width is what
 * this matches, and the taller box is the cost of a lockup that stacks.
 */
const HEIGHTS: Readonly<Record<string, string>> = {
  Webhead: "h-7 sm:h-8",
};

/** The height class for a sponsor's mark. */
export function markHeight(name: string): string {
  return HEIGHTS[name.trim()] ?? "h-3.5 sm:h-4";
}
