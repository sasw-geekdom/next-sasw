/**
 * Free-text matching for the schedule.
 *
 * The two selects cut by circuit and by room, and both stop cutting exactly
 * where the week gets heavy: a TPR day is twenty sessions in one room, most of
 * them on one or two circuits, so "All rooms → TPR" returns almost everything
 * and there is no second cut behind it. The question a reader actually has at
 * that point is not "which strand" — it is "is this person speaking", or "is
 * there anything on funding". Neither is a facet. Both are text.
 *
 * Deliberately not fuzzy. A schedule is a factual document and a near-miss
 * result on one is worse than an empty one: a reader who types a speaker's
 * name and gets three other people back has to check whether the site is
 * guessing or whether they were wrong about the week. Substring matching is
 * predictable, and typing less of the word is the recovery for a misspelling.
 */

/**
 * Lowercased and stripped of accents, so "Velásquez" is reachable by typing
 * "velasquez" — which is how the name is spelled in the URL, and how most
 * people will type it on a US keyboard.
 */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Everything about one row that a reader might plausibly search for. */
function haystack(row: {
  title: string;
  longTitle?: string;
  people?: string;
  circuit: string;
  venueName: string;
  venueShort?: string;
  poweredBy?: string;
  searchText?: string;
}): string {
  return fold(
    [
      // Both titles: the block prints the short one and the agenda the long
      // one, and a reader searching from memory could have read either.
      row.title,
      row.longTitle,
      // The reason this exists. Speaker names are on the cards and are the
      // one thing that distinguishes twenty otherwise identical talks.
      row.people,
      row.circuit,
      row.venueName,
      row.venueShort,
      // "PNC Bank", "Active Capital" — a sponsor's own team looking for their
      // sessions is a real use, and the credit is already on the card.
      row.poweredBy,
      // Whatever the CMS has hung off an activation — the names and titles
      // that live on its page and nowhere on its block. See `searchText` on
      // CalendarItem for why this is not `people`.
      row.searchText,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/**
 * Splits on whitespace and requires every term, so "sandra nopalera" narrows
 * rather than widening — the behaviour every search box a reader has used
 * before this one has.
 */
export function matchesQuery(
  row: Parameters<typeof haystack>[0],
  query: string | null,
): boolean {
  if (query === null) return true;
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = haystack(row);
  return terms.every((term) => text.includes(term));
}
