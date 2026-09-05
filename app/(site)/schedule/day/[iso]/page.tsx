import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BackLink } from "@/components/site/back-link";
import { DayCalendarGrid } from "@/components/site/day-calendar-grid";
import type { Option } from "@/components/site/calendar/controls";
import { EVENT_DAYS } from "@/lib/event";
import { dayCalendar } from "@/lib/schedule";
import { liveSchedule } from "@/lib/live-schedule";
import { TRACK_NAMES } from "@/lib/tracks";

// One day of the week, at full resolution.
//
// A route rather than a mode on /schedule, for three reasons: it is linkable
// (an organiser sending "here's Tuesday" is the obvious use), it prerenders —
// there are exactly five of these and they are known at build time — and the
// back button does the right thing between the week and a day without any
// state to restore.
//
// /schedule/[slug] resolves activations and venues from a fixed list, and
// `day` is a static segment, so it takes precedence and cannot collide.

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return EVENT_DAYS.map((d) => ({ iso: d.iso }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ iso: string }>;
}): Promise<Metadata> {
  const { iso } = await params;
  const live = await liveSchedule();
  const data = dayCalendar(iso, live.items, live.attached);
  if (!data) return {};

  const rooms = data.venues.map((v) => v.name).join(", ");
  const description = data.venues.length
    ? `${data.day.weekday}, ${data.day.label} at San Antonio Startup + Tech Week — every room, side by side. ${rooms}.`
    : `${data.day.weekday}, ${data.day.label} at San Antonio Startup + Tech Week.`;

  return {
    title: `${data.day.weekday} · ${data.day.label}`,
    description,
    alternates: { canonical: `/schedule/day/${iso}` },
    openGraph: {
      title: `${data.day.weekday} ${data.day.label} · SASTW 2026`,
      description,
      url: `/schedule/day/${iso}`,
    },
  };
}

export default async function ScheduleDayPage({
  params,
}: {
  params: Promise<{ iso: string }>;
}) {
  const { iso } = await params;
  const live = await liveSchedule();
  const data = dayCalendar(iso, live.items, live.attached);
  if (!data) notFound();

  const { day, venues, items, spans, axis, index } = data;
  // Only the circuits this day actually runs. A chip with nothing behind it is
  // a control whose only outcome is an empty grid.
  const present = new Set([
    ...items.map((i) => i.circuit),
    ...spans.map((s) => s.circuit),
  ]);
  const circuits: Option[] = (TRACK_NAMES as readonly string[])
    .concat("Social")
    .filter((name) => present.has(name))
    .map((name) => ({ value: name, label: name }));

  return (
    <main className="bg-black">
      {/* Wider than the site's max-w-7xl from 2xl. Every other section holds a
            reading measure, and should — but a calendar is a data grid, not
            prose, and on a 2560px display the 1280px one stranded the whole
            week in the middle of the screen with 640px of black either side,
            every block smaller in absolute terms than the same block on a
            phone. 110rem cuts that margin to 400 and gives each day column
            about a hundred more pixels.

            A deliberate break from the page's measure rather than a free win:
            this section is now the one that runs wider than its neighbours. */}
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20 2xl:max-w-[110rem]">
        <BackLink
          // Only the fallback: BackLink prefers router.back(), which restores
          // the exact scroll position for anyone who came from the week. This
          // is the path for someone who arrived on a shared link to this day
          // and has no week behind them.
          href="/schedule#the-week"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          {/* Generic. See `BackLink` — a day is reachable from a talk page's
              "The rest of the day" as well as from the week, and this label
              was only ever true of the second. */}
          Back
        </BackLink>

        {/* The rail used to sit at the right of this row, on the standfirst's
            baseline — one control alone at x=870 with the filters starting
            240px lower and 770px to its left. It is a control, not a header,
            so it has moved into the control bar with the others, where it
            takes the position the week view gives its view toggle. */}
        <div className="mt-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Day {index + 1} of {EVENT_DAYS.length} · {day.label}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              {day.weekday}.
            </h1>
            {/* Keyed on timed sessions, not on `venues`. A room counts as
                present there if it has anything at all, and a multi-day drive
                is enough — so Tuesday, which has only Give-a-LOT running
                through it, was promising a room-by-room read above nothing.

                "Side by side", not "hour by hour": the day dropped its axis
                with the week, so there are no hours on the page to promise. */}
            <p className="mt-4 text-pretty text-white/60">
              {items.length > 0
                ? "Every room, side by side."
                : spans.length > 0
                  ? "Nothing on the clock yet — what runs all week is below."
                  : "Nothing confirmed on this day yet. It fills as the week locks."}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="mt-10 h-[42rem]" />}>
          <DayCalendarGrid
            activeDay={iso}
            venues={venues}
            items={items}
            spans={spans}
            axis={axis}
            circuits={circuits}
          />
        </Suspense>
      </div>
    </main>
  );
}
