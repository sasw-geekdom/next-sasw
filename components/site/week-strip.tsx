import Link from "next/link";
import { scheduleByDay, whenShort } from "@/lib/schedule";

// The week at a glance, above the deep dives.
//
// The page had no answer to "what's on Tuesday?" — seven activations arrived
// in neither chronological nor venue order, and the reader had to assemble the
// shape themselves. This is that shape, stated once before anything else asks
// for attention.
//
// Every day in the week appears, including the ones with nothing confirmed.
// A day the reader can see is still filling is information; a day silently
// missing from the list is a hole they have to notice on their own. The hero
// already promises "the full schedule lands closer to the week", so a column
// that says so is keeping that promise rather than admitting a gap.

export function WeekStrip() {
  const days = scheduleByDay();
  const confirmed = days.reduce((n, d) => n + d.sessions.length, 0);

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            The week · Sept 28 – Oct 2
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
            Five days, one current.
          </h2>
          {/* One template string rather than an expression next to text.
              Split across lines, JSX dropped the space before "activations"
              and it rendered as "7activations"; prettier normalises a {" "}
              away again, so the count is interpolated instead. */}
          <p className="mt-4 text-pretty text-white/60">
            {`${confirmed} activations locked so far. More lands on every day as it\u2019s confirmed.`}
          </p>
        </div>

        {/* Five columns from lg, a stack below it. Not a scroller: five days is
            few enough to show at once, and a horizontal scroll would hide the
            back half of the week behind a gesture. */}
        <ol className="mt-10 grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-5">
          {days.map((day) => (
            <li key={day.iso} className="flex flex-col gap-4 bg-black p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest">
                <span className="text-white">{day.weekday}</span>{" "}
                <span className="text-white/45">{day.label}</span>
              </p>

              {day.sessions.length === 0 ? (
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/35">
                  Still landing
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {day.sessions.map((s) => (
                    <li key={s.slug}>
                      {/* Linked where the activation has a page of its own;
                          plain text where it doesn't, rather than a dead
                          anchor. */}
                      {s.page ? (
                        <Link
                          href={`/schedule/${s.page}`}
                          className="group block focus-visible:outline-none"
                        >
                          <Row session={s} interactive />
                        </Link>
                      ) : (
                        <Row session={s} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Row({
  session,
  interactive = false,
}: {
  session: ReturnType<typeof scheduleByDay>[number]["sessions"][number];
  interactive?: boolean;
}) {
  return (
    <>
      <p
        className={
          interactive
            ? "text-pretty text-sm font-medium leading-snug text-white transition-colors duration-200 group-hover:text-magenta group-focus-visible:text-magenta"
            : "text-pretty text-sm font-medium leading-snug text-white"
        }
      >
        {session.title}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/45">
        {session.when ? `${whenShort(session.when).time} · ` : ""}
        {session.venue.name}
      </p>
    </>
  );
}
