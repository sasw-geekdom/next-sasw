import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FAQ, BADGE_DESKS, GARAGES } from "@/lib/faq";
import { ROOMS } from "@/lib/locations";
import { DowntownMap, type MapPin } from "@/components/site/downtown-map";

/**
 * The one-pager.
 *
 * Black, at max-w-7xl, with `border-t border-white/10` between sections —
 * which is not a choice so much as the house's: every section below the hero
 * on the homepage, the schedule and every activation page is built that way,
 * and a light page at max-w-5xl read as a different site wearing the same
 * navbar. The four beats inside each section are the house's too: mono eyebrow
 * in magenta, display headline, copy at white/60, one action.
 *
 * The sticky rail holding a section's name beside its questions is the pattern
 * from the activation pages, for the same reason: a reader four answers into
 * parking can still see which section they are in.
 */

/**
 * Where a pin's name sits when the default would collide — see `label` on
 * MapPin. Legacy Park, City Tower and The Rand are three pins on one block.
 */
const LABEL_AT: Record<
  string,
  { dx: number; dy: number; anchor: "start" | "middle" | "end" }
> = {
  "legacy-park": { dx: -36, dy: -2, anchor: "end" },
  // Above its pin: at phone type sizes "The Rand" set to the right ran into
  // "Houston Street", which sits a block east on the same line.
  "the-rand": { dx: 0, dy: -48, anchor: "middle" },
  "City Tower Garage": { dx: 0, dy: 50, anchor: "middle" },
  "St. Mary's Garage": { dx: 0, dy: -48, anchor: "middle" },
  "Library Garage": { dx: 0, dy: 46, anchor: "middle" },
  // The inset is a third the width, so a name that clears the frame on the
  // main map runs off this one. Both of these sit under their pin.
  "central-library": { dx: 0, dy: -38, anchor: "middle" },
};

/** What a room is called on the map, where its own name is too long. */
const SHORT: Record<string, string> = {
  tpr: "TPR",
  "the-rand": "The Rand",
  "central-library": "Central Library",
  "legacy-park": "Legacy Park",
};

/**
 * The map's pins, out of the page's own data rather than a second list.
 *
 * Badge desks and rooms come from ROOMS, which is where their coordinates
 * already are; garages carry their own. A room with no coordinate is left off
 * rather than placed approximately — 300 Main has none yet, and a pin a block
 * from the truth is worse than no pin on a map somebody is about to drive at.
 */
function mapPins(): MapPin[] {
  const deskSlugs = new Set(BADGE_DESKS.map((d) => d.room));
  const rooms: MapPin[] = ROOMS.filter((r) => r.place?.coords).map((room) => {
    const isDesk = deskSlugs.has(room.slug);
    return {
      id: room.slug,
      kind: isDesk ? "badge" : "room",
      name: room.name,
      short: SHORT[room.slug] ?? room.name,
      address:
        room.place?.address +
        (room.place?.floor ? ` · ${room.place.floor}` : ""),
      note: isDesk
        ? (BADGE_DESKS.find((d) => d.room === room.slug)?.note ?? "")
        : room.host,
      lat: room.place!.coords!.lat,
      lon: room.place!.coords!.lon,
      href: `/schedule/${room.slug}`,
      hrefLabel: "What's here",
      label: LABEL_AT[room.slug],
    };
  });
  const garages: MapPin[] = GARAGES.map((g) => ({
    id: g.name,
    kind: "parking",
    name: g.name,
    // Without the word "garage", since every white pin is one — except the
    // library's, where "Library" under "Central Library" reads as a second
    // name for the same building.
    short:
      g.name === "Library Garage" ? g.name : g.name.replace(/ Garage$/, ""),
    address: g.address,
    note: `${g.rate}. ${g.serves}`,
    lat: g.lat,
    lon: g.lon,
    href: g.href,
    hrefLabel: "Rates",
    label: LABEL_AT[g.name],
  }));
  // Parking last, so a garage's pin sits over a room's where they share a
  // doorway rather than under it.
  return [...rooms, ...garages];
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-widest text-magenta">
      {children}
    </p>
  );
}

/** The link under an answer, in the house's small-action register. */
function Action({ label, href }: { label: string; href: string }) {
  const external = href.startsWith("http");
  const className =
    "inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:text-magenta";
  const inner = (
    <>
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function Answer({
  q,
  a,
  link,
}: {
  q: string;
  a: string[];
  link?: { label: string; href: string };
}) {
  return (
    // A definition list, because that is what this is: the question is the
    // term and the answer defines it. Screen readers announce the pairing; a
    // stack of paragraphs does not.
    <div className="border-t border-white/10 py-7 first:border-t-0 first:pt-0">
      <dt className="text-pretty font-display text-lg font-bold uppercase leading-tight tracking-tight text-white sm:text-xl">
        {q}
      </dt>
      <dd className="mt-3 max-w-2xl space-y-3 text-pretty text-white/60">
        {a.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {link && (
          <p className="pt-1">
            <Action {...link} />
          </p>
        )}
      </dd>
    </div>
  );
}

export function FaqBoard() {
  const desks = BADGE_DESKS.map((d) => {
    const room = ROOMS.find((r) => r.slug === d.room);
    if (!room) throw new Error(`faq: no room "${d.room}"`);
    return { ...d, room };
  });

  return (
    <main className="flex-1 bg-black">
      {/* Tighter than the homepage's py-24: the map is the thing this page is
          for, and on a 900px laptop every pixel the hero takes is a pixel of
          it below the fold. */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:py-14">
        <Eyebrow>Know before you go</Eyebrow>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Doors, badges, <span className="text-magenta">parking.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-white/60">
          Sept 28 – Oct 2, downtown San Antonio. Where to pick up a badge, where
          to leave the car, and which rooms run their own list.
        </p>
      </section>

      {/* The map answers both of the first two sections, so it sits above them
          rather than inside either. */}
      <section className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:py-10">
          <DowntownMap pins={mapPins()} />
        </div>
      </section>

      {FAQ.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="border-t border-white/10"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[20rem_1fr] lg:gap-20 lg:py-20">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Eyebrow>{section.eyebrow}</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white">
                {section.headline}
              </h2>
              {section.lead && (
                <p className="mt-4 text-pretty text-white/60">{section.lead}</p>
              )}
            </div>

            <div className="min-w-0">
              {section.id === "badges" && (
                <ul className="mb-12 grid gap-4 sm:grid-cols-3">
                  {desks.map(({ room, note }) => (
                    <li
                      key={room.slug}
                      className="rounded-xl border border-white/10 bg-white/5 p-5"
                    >
                      <p className="font-display text-base font-bold uppercase leading-tight tracking-tight text-white">
                        {room.name}
                      </p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
                        {room.place?.address}
                        {room.place?.floor ? ` · ${room.place.floor}` : ""}
                      </p>
                      <p className="mt-3 text-sm text-white/60">{note}</p>
                    </li>
                  ))}
                </ul>
              )}

              {section.id === "parking" && (
                <ul className="mb-12 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {GARAGES.map((g) => (
                    <li
                      key={g.name}
                      className="flex flex-col gap-2 p-5 sm:flex-row sm:items-baseline sm:gap-8"
                    >
                      <div className="sm:w-52 sm:flex-none">
                        <a
                          href={g.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-start gap-1 font-display text-base font-bold uppercase leading-tight tracking-tight text-white transition-colors hover:text-magenta"
                        >
                          {g.name}
                          <ArrowUpRight
                            className="mt-0.5 h-3.5 w-3.5 flex-none opacity-50"
                            aria-hidden="true"
                          />
                        </a>
                        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
                          {g.address}
                        </p>
                      </div>
                      <div className="min-w-0">
                        {/* The rate first, in the mono register the rest of
                            the site uses for data. It is what the row is
                            for. */}
                        <p className="font-mono text-sm uppercase tracking-wide text-white">
                          {g.rate}
                        </p>
                        <p className="mt-1 text-pretty text-sm text-white/60">
                          {g.serves}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <dl>
                {section.items.map((item) => (
                  <Answer key={item.q} {...item} />
                ))}
              </dl>
            </div>
          </div>
        </section>
      ))}

      {/* The rooms, once, at the foot — the addresses every answer above
          refers to, derived from ROOMS rather than retyped. */}
      <section id="rooms" className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:py-20">
          <Eyebrow>The rooms</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white">
            Six addresses.
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROOMS.map((room) => (
              <li
                key={room.slug}
                className="rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/25"
              >
                <Link href={`/schedule/${room.slug}`} className="block p-5">
                  <p className="font-display text-base font-bold uppercase leading-tight tracking-tight text-white">
                    {room.name}
                  </p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
                    {room.place?.address ?? "Address to come"}
                    {room.place?.floor ? ` · ${room.place.floor}` : ""}
                  </p>
                  <p className="mt-3 text-sm text-white/60">{room.host}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* One action, and it is the one every other surface ends on. */}
      <section className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <h2 className="max-w-2xl font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
            The current runs through SA.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-white/60">
            Registration is free, and the badge is waiting at three desks
            downtown.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-magenta px-7 py-3 font-display text-lg font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
          >
            Plug in.
          </Link>
        </div>
      </section>
    </main>
  );
}
