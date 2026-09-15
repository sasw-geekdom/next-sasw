import Link from "next/link";
import { EVENT_DAYS } from "@/lib/event";
import type { CalendarItem, CalendarSpan } from "@/lib/schedule";

/**
 * The programme as a plain list, for readers that never run the grid.
 *
 * The calendar is about 3,800 lines of client component — lane assignment,
 * filters, pointer selection, the multi-select that builds an .ics. None of
 * that should be server-rendered and none of it can be. The cost was that the
 * schedule, which is the most useful thing on this site, existed in the served
 * HTML only as a heading and a row of controls: a plain fetch of /schedule or
 * of a day got no sessions at all.
 *
 * Search engines were never the ones hurt — they run JavaScript, and both
 * surfaces publish full JSON-LD beside the grid. What this is for is everything
 * that reads markup and stops: a `curl`, a text-mode browser, an assistant
 * summarising a page it fetched, a preview bot. They were being told the week
 * exists and not what is in it.
 *
 * Inside `<noscript>`, deliberately, rather than rendered and hidden:
 *
 *   - Hidden-but-present would be read by screen readers *as well as* the
 *     grid, which already carries proper labels. Two readings of the same
 *     week is worse for them than one, so the accessible answer here is not
 *     to add anything they can hear.
 *   - Rendered and visible would duplicate the schedule underneath itself for
 *     everyone else.
 *
 * `<noscript>` is the one state where the grid genuinely is not there, which
 * is exactly the audience with the problem. It costs nothing to anyone else:
 * a browser with JavaScript never renders it.
 */
export function CalendarFallbackList({
  items,
  spans,
  /** Group under day headings. Off for a single day, which has only one. */
  byDay = false,
  heading,
}: {
  items: CalendarItem[];
  spans: CalendarSpan[];
  byDay?: boolean;
  heading: string;
}) {
  if (items.length === 0 && spans.length === 0) return null;

  const groups = byDay
    ? EVENT_DAYS.map((d) => ({
        label: `${d.label}`,
        items: items.filter((i) => i.dayIso === d.iso),
      })).filter((g) => g.items.length > 0)
    : [{ label: "", items }];

  return (
    <noscript>
      {/* Styled, not bare. The list is legible to anything parsing markup
          either way, but a person reading with JavaScript off is a person
          too — and unstyled it inherited the page's dark ground with no
          colour of its own, which is white-on-white's opposite and just as
          unreadable. Tailwind classes work here: the stylesheet arrives
          through a <link>, which needs no JavaScript. */}
      <section className="mt-10 border-t border-white/10 pt-10 text-white/75">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
          {heading}
        </h2>

        {/* The all-week entries first, as the grid puts them on a rail above
            the axis. A list has no rail, so they are named as what they are. */}
        {spans.length > 0 && (
          <>
            <h3 className="mt-6 font-mono text-[11px] uppercase tracking-widest text-magenta">
              All week
            </h3>
            <ul className="mt-3 space-y-2">
              {spans.map((s) => (
                <li key={s.slug} className="text-sm">
                  {s.page ? (
                    <Link href={`/schedule/${s.page}`} className="text-white underline underline-offset-4">
                      {s.title}
                    </Link>
                  ) : (
                    s.title
                  )}
                  {" — "}
                  {s.dayLabel} · {s.venueName} · {s.circuit}
                </li>
              ))}
            </ul>
          </>
        )}

        {groups.map((g) => (
          <div key={g.label || "all"}>
            {g.label && (
              <h3 className="mt-7 font-mono text-[11px] uppercase tracking-widest text-magenta">
                {g.label}
              </h3>
            )}
            <ul className="mt-3 space-y-2">
              {g.items.map((i) => (
                <li key={`${i.slug}-${i.startMin}`} className="text-sm">
                  {/* `longTitle`, not `title`: the grid shortens a name to fit
                      a lane and a list has no lane to fit. */}
                  {i.href ? (
                    <Link href={i.href} className="text-white underline underline-offset-4">
                      {i.longTitle}
                    </Link>
                  ) : (
                    i.longTitle
                  )}
                  {" — "}
                  {i.timeLabel} · {i.venueName} · {i.circuit}
                  {i.people ? ` · ${i.people}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </noscript>
  );
}
