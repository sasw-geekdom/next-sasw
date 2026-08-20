import Link from "next/link";
import { EVENT_DAYS } from "@/lib/event";
import { cn } from "@/lib/utils";

// Week or one day, as a single control.
//
// The day views existed before this and were reachable only by clicking a
// column head, which turned magenta on hover and was otherwise invisible — a
// whole half of the schedule behind an affordance nobody could see. This is
// that half, stated.
//
// It also settles what the section's one primary action is. The chips filter
// what you're looking at; this chooses what you're looking at, which is the
// larger decision and belongs above them.
//
// Deliberately not `rounded-full`. The filter chips are pills, and a second
// pill row directly above them would read as a third filter — "Mon 28" looks
// exactly like a chip if it is shaped like one. A segmented bar is the house
// vocabulary for a set of mutually exclusive views, and it says "pick one"
// where a pill row says "narrow this".

/** "Mon" — the weekday alone, which is all a 390px screen has room for. */
function weekday(iso: string): string {
  return new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
  });
}

export function DayRail({
  /** "week", or the ISO date of the day being viewed. */
  active,
  className,
}: {
  active: string;
  className?: string;
}) {
  const segments = [
    // Hashed, because the week calendar is a section partway down /schedule
    // rather than the page itself. A bare /schedule drops the reader at the
    // top and makes them scroll back to the thing they were just looking at.
    { key: "week", href: "/schedule#the-week", label: "Week", date: "" },
    ...EVENT_DAYS.map((day) => ({
      key: day.iso,
      href: `/schedule/day/${day.iso}`,
      label: weekday(day.iso),
      // The date is dropped below sm. Six segments reading "Mon 28" need
      // ~380px and the content box on a 390px phone is 342, so the bar wrapped
      // and left "Fri 2" alone on a second row inside a box drawn for one —
      // which reads as broken rather than as five days. The eyebrow directly
      // above already says Sept 28 – Oct 2, so the number is the half to lose.
      date: String(Number(day.iso.slice(8, 10))),
    })),
  ];

  return (
    // Rendered twice per page — once on the headline's baseline for lg and up,
    // once in the control block below it for phones. Both can't be one
    // element: on desktop it belongs beside the heading, on a phone it belongs
    // between the standfirst and the filters, and no single position in the
    // flow is both.
    //
    // Duplicating it costs nothing in the accessibility tree, because whichever
    // copy is out of play is `display: none` and therefore not in the tree at
    // all — so there is never a second "Schedule view" landmark, only a second
    // few lines of markup.
    <nav aria-label="Schedule view" className={className}>
      <ul
        // Never wraps. A segmented control that breaks across rows stops
        // reading as one control; if it can't fit it scrolls, which at least
        // keeps the shape honest.
        className="flex overflow-x-auto rounded-md border border-white/20 font-mono text-[10px] uppercase tracking-widest [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {segments.map((segment, i) => {
          const current = segment.key === active;
          return (
            // `flex-1` below lg so the six segments divide the width evenly
            // and the bar ends where the screen does. Sized to content, it
            // stopped ~50px short and left a pocket of dead space inside the
            // border after "Fri", which reads as a bar that failed to fill
            // rather than a control that fits. From lg it sits beside the
            // headline, where hugging its content is the correct behaviour.
            <li key={segment.key} className="flex flex-1 lg:flex-none">
              {current ? (
                // The view you're on is not a link to itself. `aria-current`
                // is what tells a screen reader which segment is live, since
                // the magenta fill can't.
                <span
                  aria-current="page"
                  className={cn(
                    "w-full whitespace-nowrap bg-magenta px-2 py-2 text-center text-black sm:px-3",
                    i > 0 && "border-l border-white/20",
                  )}
                >
                  {segment.label}
                  {segment.date && (
                    <span className="hidden sm:inline"> {segment.date}</span>
                  )}
                </span>
              ) : (
                <Link
                  href={segment.href}
                  className={cn(
                    "w-full whitespace-nowrap px-2 py-2 text-center text-white/65 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta sm:px-3",
                    i > 0 && "border-l border-white/20",
                  )}
                >
                  {segment.label}
                  {segment.date && (
                    <span className="hidden sm:inline"> {segment.date}</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
