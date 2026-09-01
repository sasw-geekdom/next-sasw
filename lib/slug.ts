// Client-safe — the admin drawer previews the public URL as you type.

const MAX_LENGTH = 80;

/**
 * "Ana O'Brien-Reyes" -> "ana-obrien-reyes". Accents are folded, apostrophes
 * are dropped rather than hyphenated (o-brien reads worse than obrien), and
 * every other non-alphanumeric run collapses to a single hyphen.
 *
 * Never returns an empty string — a name with no latin characters at all
 * still needs a routable slug, and the collision suffix keeps it unique.
 *
 * `fallback` is what that empty case becomes. It defaults to "speaker" because
 * this started as the speakers' own helper; sessions pass "session", so a talk
 * titled entirely in non-latin script does not route as /talk/speaker.
 */
export function slugify(value: string, fallback = "speaker"): string {
  const base = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // combining marks left behind by NFKD
    .toLowerCase()
    .replace(/['’ʼ`]/g, "") // apostrophes, straight and curly
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");
  return base || fallback;
}

/** True for a slug already in the shape `slugify` produces. */
export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= MAX_LENGTH;
}

/**
 * `desired`, or the first free `desired-2`, `desired-3`… Two speakers named
 * Ana Reyes get `ana-reyes` and `ana-reyes-2`; whoever was saved first keeps
 * the clean one.
 */
export function uniqueSlug(desired: string, taken: Set<string>): string {
  if (!taken.has(desired)) return desired;
  let n = 2;
  while (taken.has(`${desired}-${n}`)) n += 1;
  return `${desired}-${n}`;
}
