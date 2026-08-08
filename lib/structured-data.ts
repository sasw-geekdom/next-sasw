// JSON-LD for the week and its activations.
//
// This is what feeds Google's event rich results — the date, venue and
// register link shown in the search listing itself rather than only after a
// click. The site already holds everything the schema wants: confirmed start
// and end with real timezone offsets, a venue, an organiser and a canonical
// URL. Nothing here is invented; every field is read off the same data the
// page renders, so the markup cannot drift from what a visitor sees.
//
// Only activations with a confirmed `when` are described. An Event without a
// start date is not eligible for rich results anyway, and publishing one for
// something still being locked would be marking up a guess.

import { SITE_URL } from "@/lib/event";
import type { ResolvedSession } from "@/lib/schedule";

/** Stable @id for the week, so activations can point at it as their parent. */
const WEEK_ID = `${SITE_URL}/#event`;

const ORGANIZER = {
  "@type": "Organization",
  name: "San Antonio Startup + Tech Week",
  url: SITE_URL,
} as const;

/**
 * Free to attend, which is a fact worth stating in the markup — Google shows
 * price in the listing, and "Free" is the strongest thing this event can say
 * there.
 */
const FREE_OFFER = {
  "@type": "Offer",
  price: "0",
  priceCurrency: "USD",
  availability: "https://schema.org/InStock",
  url: `${SITE_URL}/register`,
} as const;

/**
 * A venue as a Place.
 *
 * `address` is required for an offline event, and this is as precise as the
 * data goes today — the rooms carry a name, a host and a description, but no
 * street address. Locality/region/country is valid and accepted; adding
 * `streetAddress` per room would strengthen the result, and is the one field
 * worth filling in if the addresses are to hand.
 */
function place(name: string) {
  return {
    "@type": "Place",
    name,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Antonio",
      addressRegion: "TX",
      addressCountry: "US",
    },
  };
}

/** The week itself. Rendered on the homepage. */
export function weekEvent() {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": WEEK_ID,
    name: "San Antonio Startup + Tech Week 2026",
    description:
      "Year 11. Five days, five circuits, one current — keynotes, pitch stages, workshops and the nights after, across downtown San Antonio.",
    // All-day across the week, so plain dates rather than timestamps.
    startDate: "2026-09-28",
    endDate: "2026-10-02",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: place("Downtown San Antonio"),
    organizer: ORGANIZER,
    offers: FREE_OFFER,
    url: SITE_URL,
    image: [`${SITE_URL}/brand/bolt-current-og.png`],
  };
}

/**
 * One confirmed activation, tied back to the week through `superEvent` so the
 * two are understood as parent and child rather than as competing events on
 * the same days.
 *
 * Returns null when the activation has no confirmed time.
 */
export function activationEvent(session: ResolvedSession) {
  if (!session.when) return null;

  const url = `${SITE_URL}/schedule/${session.page}`;
  const image = session.hero?.src
    ? `${SITE_URL}${session.hero.src}`
    : `${SITE_URL}/brand/bolt-current-og.png`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: session.title,
    description: session.blurb,
    // Kept as authored — ISO 8601 with an explicit offset, which is what
    // schema.org wants and what the .ics and the visible label already use.
    startDate: session.when.start,
    endDate: session.when.end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: place(session.venue.name),
    // The partner running it where there is one; otherwise us.
    organizer: session.site
      ? {
          "@type": "Organization",
          name: session.site.label,
          ...(session.site.href ? { url: session.site.href } : {}),
        }
      : ORGANIZER,
    superEvent: { "@id": WEEK_ID },
    offers: FREE_OFFER,
    url,
    image: [image],
  };
}

/**
 * Serialise for a `<script type="application/ld+json">`.
 *
 * `<` is escaped because a literal `</script>` anywhere in the data would end
 * the tag early and spill the rest into the document. Nothing in this data
 * contains one today, but the copy is edited by hand and the failure is
 * silent — the page would simply break.
 */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
