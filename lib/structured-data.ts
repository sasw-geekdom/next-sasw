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

/**
 * Who convenes the week.
 *
 * This used to be the event naming itself as its own organiser, which is
 * circular and tells a crawler nothing. The week is curated by Geekdom and
 * Launch SA — a fact the site states nowhere else, and the one an `organizer`
 * field exists to carry.
 *
 * An array because there are genuinely two of them and schema.org takes a list
 * here. Activations fall back to this when no partner runs them, which stays
 * true: an activation the week puts on is one these two put on.
 *
 * "Launch SA", spaced, which is how the rest of the site writes it.
 */
const ORGANIZER = [
  { "@type": "Organization", name: "Geekdom", url: "https://geekdom.com" },
  { "@type": "Organization", name: "Launch SA", url: "https://launchsa.org" },
] as const;

/**
 * Free to attend, which is a fact worth stating in the markup — Google shows
 * price in the listing, and "Free" is the strongest thing this event can say
 * there.
 *
 * `url` is where the offer is taken up, and Google renders it as the link on
 * the rich result. For the week and for everything it covers that is our own
 * registration; an activation entered somewhere else overrides it below.
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
 * `address` is required for an offline event, and all six rooms carry a street
 * address, so every one emits `streetAddress` — the difference between
 * "somewhere in San Antonio" and a pin.
 *
 * Four also carry coordinates and so emit `geo`. The other two do not: 300
 * Main arrived from a different source with a postal code instead, and Trinity
 * is a 117-acre campus where a single pin would be a guess about which
 * building. Each venue publishes exactly what has been confirmed for it and
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
      "Year 11. Five days, five circuits, one current — keynotes, pitch stages, workshops and the nights after, across San Antonio.",
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
    // Still free, but not always ours to give. An activation with `register`
    // set is ticketed by its host — Trinity's competition is the only one —
    // and the offer has to point where the ticket actually is. Left on the
    // default, the "Free · Register" link on a search result would have sent
    // someone to a Startup + Tech Week signup that does not admit them to
    // this event, which is the same wrong promise the page's own button was
    // carrying until `register` fixed it. The markup has to say what the page
    // says.
    offers: session.register
      ? { ...FREE_OFFER, url: session.register.href }
      : FREE_OFFER,
    url,
    image: [image],
  };
}

/**
 * One standalone talk, for /schedule/talk/[slug].
 *
 * Separate from `activationEvent` rather than a branch inside it, because the
 * two describe different things off different data. An activation is a
 * curated block with a hero image, a blurb and sometimes a partner running it;
 * a talk is a CMS row with a start, a room and the people on stage.
 *
 * `performer` is the field that only exists here and is most of the point. A
 * talk's speakers are named, they have their own pages on this site, and a
 * `Person` with a `url` is what links the two entities for a crawler — the
 * thing a speaker sharing their own talk most wants working. An unresolved
 * participant is named without a url rather than pointed at a dead page; see
 * `slug` on ResolvedParticipant.
 *
 * `superEvent` points at the week, exactly as an activation does, so a talk
 * reads as part of it rather than as an unrelated event that happens to fall
 * in the same five days — or, for a session inside an activation, at that
 * activation, which points at the week in turn. See `partOf`.
 *
 * No `image` override: the OG route builds a card per talk and the metadata
 * already points at it, but that URL carries a content hash Next owns. Naming
 * the shared bolt here keeps the markup honest rather than guessing at a path
 * that changes on every deploy.
 */
export interface TalkEventInput {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601, as schema.org wants. */
  startIso: string;
  endIso: string;
  room: { name: string; place?: Room["place"] } | null;
  people: { name: string; slug: string }[];
  /**
   * The activation this runs inside, where it runs inside one.
   *
   * Sessions with an activation used to have no page at all, so every talk
   * here was a child of the week and nothing else. Now that they do, saying so
   * is what keeps the two pages from reading as rivals: the six PySanAntonio
   * abstracts each have a URL *and* the afternoon that gathers them has one,
   * and a crawler with no link between them sees seven events at the same
   * level describing the same five hours.
   *
   * No `@id`: an activation publishes none (see `activationEvent`), so the
   * chain is written out as a nested node keyed by `url`, with the week above
   * it — session inside activation inside week, which is the truth.
   */
  partOf?: { name: string; url: string } | null;
}

export function talkEvent(talk: TalkEventInput) {
  const url = `${SITE_URL}/schedule/talk/${talk.slug}`;
  const performers = talk.people
    .filter((p) => p.name)
    .map((p) => ({
      "@type": "Person",
      name: p.name,
      ...(p.slug ? { url: `${SITE_URL}/speakers/${p.slug}` } : {}),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: talk.title,
    ...(talk.description ? { description: talk.description } : {}),
    startDate: talk.startIso,
    endDate: talk.endIso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    // A talk with no resolvable room is still a real event; omitting `location`
    // costs the rich result rather than publishing an address that is a guess.
    ...(talk.room ? { location: place(talk.room) } : {}),
    ...(performers.length > 0 ? { performer: performers } : {}),
    organizer: ORGANIZER,
    superEvent: talk.partOf
      ? {
          "@type": "Event",
          name: talk.partOf.name,
          url: talk.partOf.url,
          superEvent: { "@id": WEEK_ID },
        }
      : { "@id": WEEK_ID },
    offers: FREE_OFFER,
    url,
    image: [`${SITE_URL}/brand/bolt-current-og.png`],
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
export function scheduleGraph(
  sessions: ResolvedSession[],
  talks: TalkEventInput[] = [],
) {
  // Talks belong in this list for the same reason they have their own pages:
  // /schedule visibly draws them, and described nine activations and nothing
  // else. There is no cost to including them here — an ItemList has no lanes
  // to lose, which is the whole reason the *visible* grid keeps a dense run
  // on a rail and this does not have to.
  const events = [
    ...sessions.map(activationEvent),
    ...talks.map(talkEvent),
  ].filter((e): e is NonNullable<typeof e> => e !== null);

  // Sorted on epoch, not on the string. Three date shapes meet here and only
  // one of them compares as text: an activation's `-05:00`, a span's plain
  // `YYYY-MM-DD`, and a talk's UTC `Z`. Comparing "2026-10-01T13:00:00-05:00"
  // against "2026-10-01T18:00:00.000Z" lexically puts the same instant in the
  // wrong order — the bug the .ics export already had to fix.
  events.sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));

  return {
    "@context": "https://schema.org",
    "@graph": [
      nested(weekEvent()),
      // Chronological, mixing activations and talks rather than grouping them.
      // A schedule reads in time order; "everything big first, then everything
      // small" is a fact about our data model, not about the week.
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
 * One day of the week, for /schedule/day/[iso].
 *
 * These five pages published nothing at all, which mattered more than it
 * sounds: the calendar they draw is a client component, so the day's contents
 * reach a crawler only through the RSC payload. A reader with JavaScript sees
 * the grid and an agent with JavaScript can be made to; a plain fetch of
 * "what is on Thursday" got a page with a heading and no answer.
 *
 * /schedule had the same client-rendered grid and did not have the same
 * problem, because `scheduleGraph` describes the whole week in JSON-LD beside
 * it. This is that, narrowed to a day.
 *
 * The same `@graph` shape, and for the same reason: the week node travels with
 * the list so the `superEvent` reference on every event resolves on this page
 * rather than depending on a crawler having read the homepage first.
 */
export function dayGraph(
  iso: string,
  weekday: string,
  sessions: ResolvedSession[],
  talks: TalkEventInput[] = [],
) {
  const events = [...sessions.map(activationEvent), ...talks.map(talkEvent)]
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));

  return {
    "@context": "https://schema.org",
    "@graph": [
      nested(weekEvent()),
      {
        "@type": "ItemList",
        name: `San Antonio Startup + Tech Week 2026 — ${weekday}, ${iso}`,
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
 * A speaker, for /speakers/[slug].
 *
 * Forty-six pages carried no structured data at all — no `Person`, nothing —
 * which is the wrong way round for the pages the sitemap itself calls "the
 * reason slugs exist: they're what gets shared".
 *
 * `sameAs` is the part worth having. It is how a search engine or an agent
 * ties this page to the same human on LinkedIn or their own site, rather than
 * guessing from a name that several people share. Only the links a speaker
 * actually gave us go in; nothing is inferred.
 *
 * `performerIn` names the sessions they are giving. By `url` and `name`, not
 * by `@id`: `talkEvent` publishes no `@id`, so an `@id` reference here would
 * dangle rather than resolve. A session that belongs to an activation points
 * at the activation, because that is the page it renders on.
 */
export function personSchema(p: {
  name: string;
  slug: string;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
  image?: string | null;
  links?: (string | null | undefined)[];
  /** Sessions this person is giving, as they are published elsewhere. */
  performerIn?: { name: string; url: string }[];
}) {
  const sameAs = (p.links ?? []).filter(
    (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
  );
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/speakers/${p.slug}#person`,
    name: p.name,
    url: `${SITE_URL}/speakers/${p.slug}`,
    ...(p.role ? { jobTitle: p.role } : {}),
    ...(p.company
      ? { worksFor: { "@type": "Organization", name: p.company } }
      : {}),
    ...(p.bio ? { description: p.bio } : {}),
    ...(p.image ? { image: p.image } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(p.performerIn?.length
      ? {
          performerIn: p.performerIn.map((e) => ({
            "@type": "Event",
            name: e.name,
            url: e.url,
          })),
        }
      : {}),
  };
}

/**
 * A venue, for the room pages under /schedule.
 *
 * `place()` builds this node for an event's `location`; this publishes it as
 * the subject of its own page, which the six room pages were not doing. The
 * address and the coordinates were already in lib/locations and simply never
 * reached a crawler from here.
 *
 * `containedInPlace` rather than a bare address line: these are all downtown
 * San Antonio, and saying so as an entity is what lets a result cluster them.
 */
export function venuePlace(room: {
  name: string;
  slug: string;
  desc?: string;
  place?: Room["place"];
}) {
  return {
    "@context": "https://schema.org",
    ...place(room),
    "@id": `${SITE_URL}/schedule/${room.slug}#place`,
    url: `${SITE_URL}/schedule/${room.slug}`,
    ...(room.desc ? { description: room.desc } : {}),
    containedInPlace: {
      "@type": "Place",
      name: "Downtown San Antonio",
      address: {
        "@type": "PostalAddress",
        addressLocality: "San Antonio",
        addressRegion: "TX",
        addressCountry: "US",
      },
    },
  };
}

/**
 * The speaker index, for /speakers.
 *
 * /schedule describes its own list and this page did not describe its own.
 * Names and URLs only — the detail belongs on each speaker's page, and
 * repeating it here would be forty-six biographies in one payload.
 */
export function speakerListGraph(people: { name: string; slug: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Speakers — San Antonio Startup + Tech Week 2026",
    numberOfItems: people.length,
    itemListElement: people.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        "@id": `${SITE_URL}/speakers/${p.slug}#person`,
        name: p.name,
        url: `${SITE_URL}/speakers/${p.slug}`,
      },
    })),
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
