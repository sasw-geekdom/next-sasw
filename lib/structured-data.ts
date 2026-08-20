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
import type { Room } from "@/lib/locations";
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
 * `address` is required for an offline event. Four of the five rooms now carry
 * a street address and real coordinates, so those emit `streetAddress` and
 * `geo` — the difference between "somewhere in San Antonio" and a pin.
 *
 * All five rooms now carry a street address. Four also carry coordinates and
 * so emit `geo`; 300 Main arrived from a different source, with a postal code
 * instead — each venue publishes exactly what has been confirmed for it and
 * nothing inferred.
 */
function place(room: {
  name: string;
  place?: Room["place"];
  /** An authority URL for the place, for entity linking. */
  sameAs?: string;
}) {
  const addr = room.place?.address;
  const zip = room.place?.postalCode;
  const coords = room.place?.coords;
  return {
    "@type": "Place",
    name: room.name,
    ...(room.sameAs ? { sameAs: room.sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      ...(addr ? { streetAddress: addr } : {}),
      addressLocality: "San Antonio",
      addressRegion: "TX",
      ...(zip ? { postalCode: zip } : {}),
      addressCountry: "US",
    },
    ...(coords
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: coords.lat,
            longitude: coords.lon,
          },
        }
      : {}),
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
    // The district, not a building. The week genuinely runs across five
    // venues, and borrowing the anchor's street address here would state
    // something untrue to buy a stronger result — the activations carry the
    // precise addresses, and those are the pages people search for.
    //
    // "Downtown West San Antonio" rather than the vaguer "Downtown": it is a
    // real named district west of the River Walk, with its own authority at
    // downtownwestsa.com — whose own events page lists gatherings in Legacy
    // Park, one of these venues. `sameAs` points at it so the place resolves
    // to that entity rather than to a string a crawler has to guess at.
    location: place({
      name: "Downtown West San Antonio",
      sameAs: "https://www.downtownwestsa.com/",
    }),
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
  // A confirmed hour, or a multi-day window. Only `when` used to count, which
  // meant Give-a-LOT — a three-day drive with a `span` and no single hour —
  // emitted no structured data at all from its own page. schema.org takes a
  // plain `YYYY-MM-DD` for an event that occupies whole days, so the shape was
  // always expressible; nothing here was reading for it.
  const dates = session.when
    ? { startDate: session.when.start, endDate: session.when.end }
    : session.span
      ? { startDate: session.span.from, endDate: session.span.to }
      : null;
  if (!dates) return null;

  const url = `${SITE_URL}/schedule/${session.page}`;
  const image = session.hero?.src
    ? `${SITE_URL}${session.hero.src}`
    : `${SITE_URL}/brand/bolt-current-og.png`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: session.title,
    description: session.blurb,
    // Kept as authored — ISO 8601 with an explicit offset for a timed
    // activation, which is what schema.org wants and what the .ics and the
    // visible label already use; plain dates for one that spans days.
    ...dates,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: place(session.venue),
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
 * A node about to sit inside a `@graph`, minus its own `@context`.
 *
 * Written as a copy-and-delete rather than the obvious rest-destructure,
 * because `const { "@context": _, ...rest }` leaves an unused binding and this
 * repo's eslint has no ignore pattern for a leading underscore.
 */
function nested(node: object): Record<string, unknown> {
  const copy = { ...node } as Record<string, unknown>;
  delete copy["@context"];
  return copy;
}

/**
 * The whole schedule, for /schedule.
 *
 * That page emitted nothing at all — the homepage carried the week and each
 * activation carried itself, and the one page that *is* the schedule described
 * none of it. An `ItemList` of `Event`s is what a list-of-events page is
 * supposed to say, and it is what puts individual activations in a result
 * rather than only the week.
 *
 * A `@graph` rather than two scripts, so the week node is present on the same
 * page as the activations that point at it: every one carries
 * `superEvent: { "@id": WEEK_ID }`, and here that reference resolves locally
 * instead of relying on a crawler having read the homepage.
 *
 * Nested nodes drop their own `@context` — it belongs once, at the top.
 */
export function scheduleGraph(sessions: ResolvedSession[]) {
  const events = sessions
    .map(activationEvent)
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return {
    "@context": "https://schema.org",
    "@graph": [
      nested(weekEvent()),
      {
        "@type": "ItemList",
        name: "San Antonio Startup + Tech Week 2026 — schedule",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: events.length,
        itemListElement: events.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: nested(item),
        })),
      },
    ],
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
