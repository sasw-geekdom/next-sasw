import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  BrandMark,
  TitleText,
  markKind,
} from "@/components/site/calendar/marks";
import {
  weekBoard,
  type BoardDay,
  type BoardItem,
  type BoardSpan,
} from "@/lib/week-board";
import type { CalendarItem } from "@/lib/schedule";
import Image from "next/image";
import { ARROW_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The week at a glance, on the homepage, as a way into the schedule.
 *
 * ─── What it is, after two wrong versions ───────────────────────────────────
 *
 * A snapshot. Five days visible at once, the marquee names in each, and a way
 * into every one of them. It is not a week view and it is not a reel:
 *
 *  · The first build drew all nineteen sessions across five sticky columns on
 *    a 170vh stage. That is a second schedule page on the homepage — a
 *    maintenance burden, and a reason not to click through to the real one.
 *  · The second contained it but kept the scroll-driven pan, which defeats
 *    the point. A snapshot has to be seen at once; a row that travels is a
 *    row where the reader never has the whole week on screen.
 *
 * So nothing moves. There is no client component here at all — the desktop
 * layout is a five-column grid and the mobile one is a scroller, both plain
 * CSS, which is also why this ships no JavaScript.
 *
 * ─── Why it looks like the schedule now ─────────────────────────────────────
 *
 * It used to look like a promotion *for* the schedule: cards with the time in
 * magenta above the name, a solid magenta pill for the all-week bar, day heads
 * that were labels rather than links. Then /schedule dropped its hour axis and
 * became five columns of flat dark cards — and the homepage was the odd one
 * out, showing the same week in a vocabulary the destination no longer used.
 *
 * So the card is the schedule's flat card, down to the border, the fill, the
 * hover and the `time · room` meta row; the day head is the schedule's day
 * head, down to the count and the arrow; and the all-week strip is the flat
 * span bar with its rule. A reader who clicks through now lands on more of
 * what they were just looking at rather than on a redesign of it.
 *
 * Re-implemented rather than imported. calendar/blocks is `"use client"` —
 * it carries selection state and pointer handlers this has no use for — and
 * importing one component from it would pull a client boundary onto a page
 * that currently ships nothing. The values are copied deliberately, and the
 * comment on each says which file it is tracking.
 *
 * ─── Why the marks and not just titles ──────────────────────────────────────
 *
 * `brandFor` is the schedule page's own resolver, exported rather than
 * reimplemented, so an activation that gains a lockup in the data gains it
 * here at the same time. The four typeset brands — Access Granted, The Model,
 * Startup Bash, College Night — have no file; they take the display face and
 * their own accent, which `brandFor` calls the one signal that survives every
 * size. Rebuilding their bespoke lockups here would be the third copy on the
 * site and the first one nobody would remember to update.
 */

/**
 * The schedule's own mark, at the schedule's own size.
 *
 * This was a local reimplementation: a lockup pinned at 28px, or the title in
 * display caps with the brand's accent. It got three things wrong that the
 * schedule gets right, and every one of them showed. `markKind` decides
 * whether a lockup is actually legible at the width on offer and falls back
 * to the typeset mark when it is not — this drew the file regardless. The
 * typeset brands are not the title in caps: Access Granted is green-on-white
 * across two words, College Night is magenta on the second, Startup Bash is a
 * lockup of its own. And a title carrying an inline wordmark — the Nopalera
 * talk — had no way to draw it, so the homepage set in plain type what the
 * schedule set in the brand's own mark.
 *
 * `size="lg"`, which is what a week column with a lane to itself passes. A
 * board card is ~380px wide, wider than that column, so the largest bucket is
 * the honest one.
 */
function Mark({ item }: { item: BoardItem }) {
  const kind = markKind(item.brand ?? undefined, false, "lg");
  if (item.brand && kind) {
    return (
      <BrandMark
        brand={item.brand}
        title={item.title}
        dense={false}
        size="lg"
        kind={kind}
        // College Night takes two lines where there is height for them — the
        // same call the week's own cards make.
        canWrap={item.page === "college-night"}
      />
    );
  }
  // A step up in size, and only here.
  //
  // The 13px the schedule sets is a week column's measure — 230px, with a
  // lockup or a strand label competing for the same lines. A board card is
  // ~380px and holds one thing, so a session that has no mark to carry its
  // name was the smallest object in a row of full-size logos. The inline
  // wordmark inside a title is sized in `em`, so it takes the step with it.
  return (
    <span className="line-clamp-3 text-base leading-snug">
      <TitleText text={item.longTitle} href={item.href} />
    </span>
  );
}

function Entry({ item }: { item: BoardItem }) {
  const accent = item.brand?.accent;
  const body = (
    <>
      {/* The brand-tinted hover, as a layer rather than a `hover:bg-*` class:
          an inline style wins even on hover, so a branded card cannot get its
          hover from a utility. Tracks calendar/blocks. */}
      {accent && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-15"
        />
      )}
      {/* The schedule's title type, verbatim — 13px medium, `text-pretty`,
          tight leading. A typeset brand overrides it from inside `BrandMark`;
          a plain title inherits it, which is how the two stay one design. */}
      <span className="relative block min-h-7 text-pretty text-[13px] font-medium leading-tight text-white">
        <Mark item={item} />
      </span>
      {/* Pushes everything below to the card's floor — see DayColumn. */}
      <span aria-hidden="true" className="flex-1" />
      {/* The credit the activation carries, where it has one. */}
      {item.poweredBy && (
        <span className="relative mt-1.5 block truncate font-mono text-[9px] uppercase tracking-widest text-white/55">
          Powered by {item.poweredBy}
        </span>
      )}
      {/* The schedule's meta row, verbatim: 9px mono, the time in /60 and the
          room in /55 after a middle dot. */}
      <span className="relative mt-1.5 block truncate font-mono text-[9px] uppercase tracking-widest text-white/60">
        {item.time ?? "TBC"}
        <span className="text-white/55"> · {item.venue}</span>
      </span>
    </>
  );
  // calendar/blocks' flat card: `border-white/15 bg-white/[0.05]` with a
  // `white/[0.09]` hover. This was `rounded-lg` on a `ring-1` and no border,
  // which is a different object from the one the schedule draws.
  // `flex flex-col` and `flex-1`: the card is both a column item that divides
  // the height it is given and a column of its own that anchors its meta rows
  // to the bottom of it.
  const shell =
    "group relative flex flex-1 flex-col overflow-hidden rounded border border-white/15 bg-white/[0.05] px-2 py-1.5 transition-colors duration-200";
  // `item.href`, not `/schedule/${item.page}`.
  //
  // `page` is an activation's own page and a CMS talk has none — its address
  // is `/schedule/talk/<slug>`, which is why `href` exists on the item at all.
  // Built from `page` the talk fell to the unlinked branch and rendered as a
  // dead card: the Nopalera session was the lead of Tuesday's column and the
  // one thing on the board you could not click. The schedule's own blocks have
  // always linked by `href`; this was the last place still deriving one.
  return item.href ? (
    <Link
      href={item.href}
      style={accent ? { color: accent } : undefined}
      className={cn(
        shell,
        "hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={shell} style={accent ? { color: accent } : undefined}>
      {body}
    </div>
  );
}

function DayColumn({ day }: { day: BoardDay }) {
  const total = day.lead.length + day.more;
  return (
    <section
      aria-label={`${day.weekday}, ${day.label}, ${total} ${total === 1 ? "session" : "sessions"}`}
      // No `h-full`. Both containers stretch their children by default, and
      // an explicit `height: 100%` *overrides* that stretch — which on the
      // mobile rail, whose flex row has no definite height for the percentage
      // to resolve against, dropped every column back to its own content and
      // left Tuesday's cards taller than Monday's. Letting `align-items:
      // stretch` do its job is what makes the columns equal at both widths.
      className="flex w-[62vw] shrink-0 snap-start flex-col gap-2 sm:w-[38vw] lg:w-auto"
    >
      {/* The whole head is the day, and the day is a link — the schedule's
          column head exactly, arrow and count included.

          It was a label. Five days were on screen with one way out of the
          section between them, when each of those days has a page of its own
          that this snapshot is the perfect advert for. Five entry points
          instead of one, and the arrow is the house mark for "this goes
          somewhere". */}
      <Link
        href={`/schedule/day/${day.iso}`}
        className="group flex items-baseline gap-2 border-b border-white/15 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
      >
        <h3 className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white transition-colors group-hover:text-magenta">
          {day.weekday}
        </h3>
        <ArrowUpRight
          className="size-3.5 shrink-0 self-center text-white/30 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta"
          aria-hidden="true"
        />
        {/* The date alone. The count belongs on the schedule, where a column
            scrolls and the number is the only sign that ten more cards exist
            below the fold. Here nothing scrolls and the `+4 more` under the
            cards already says what is not shown — the head's total was the
            same fact told twice, in the row with the least room for it. */}
        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/45">
          {day.label}
        </span>
      </Link>
      {/* Every card the same height, and every column ending on the same
          line.
          
          The five columns were as tall as whatever was in them: College
          Night's mark takes two lines, The Model's takes one, three days
          carry a "+N more" and two do not, so the board's foot was a ragged
          edge across five different heights. That is what a week is not — the
          days are the same length as each other, and a snapshot of them
          should say so.
          
          The cards share the column between them rather than each sizing to
          its own mark, which is why the meta rows inside are `mt-auto`: the
          time and room sit on the card's floor, so the two feet line up as
          well as the two lids. */}
      <div className="flex flex-1 flex-col gap-2">
        {day.lead.map((it) => (
          <Entry key={it.slug} item={it} />
        ))}
      </div>
      {/* Held at the foot rather than following the last card, so a day with
          nothing more to report leaves the same gap as one that has. */}
      <p className="h-4 pl-1 font-mono text-[10px] uppercase tracking-widest text-white/35">
        {day.more > 0 ? `+${day.more} more` : ""}
      </p>
    </section>
  );
}

function SpanBar({ span }: { span: BoardSpan }) {
  // The schedule's flat span bar: the mark at one end, the days and the room
  // at the other, and a rule carrying the distance between them — the one
  // piece of furniture that gets better the longer the activation runs.
  //
  // It was a solid magenta pill. That was right while the week's blocks were
  // tinted by room tier and the bar needed to stand out of them; the columns
  // are flat and dark now, on both pages, and a solid house colour behind
  // Give-a-LOT's yellow-and-magenta mark is two brands arguing.
  const body = (
    <>
      {span.lockup ? (
        <Image
          src={span.lockup.src}
          alt={span.lockup.alt || span.title}
          width={span.lockup.width}
          height={span.lockup.height}
          className="h-8 w-auto shrink-0 object-contain object-left"
        />
      ) : (
        <span className="truncate text-[13px] font-medium text-white">
          {span.title}
        </span>
      )}
      <span
        aria-hidden="true"
        className="h-px min-w-0 flex-1 bg-gradient-to-r from-white/5 via-white/20 to-white/20"
      />
      <span className="shrink-0 truncate font-mono text-[10px] uppercase tracking-widest">
        <span className="text-white/70">{span.dayLabel}</span>
        <span className="px-2 text-white/25">·</span>
        <span className="text-white/50">{span.venueName}</span>
      </span>
    </>
  );
  // A bar over the columns, not a card in one. Give-a-LOT is true of every day
  // behind it; inside a column it would claim a Tuesday it does not have.
  const cls =
    "flex w-full items-center gap-4 rounded border border-white/15 bg-white/[0.05] px-3 py-1.5 transition-colors duration-200";
  return span.page ? (
    <Link
      href={`/schedule/${span.page}`}
      className={cn(
        cls,
        "hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function WeekBoard({ items }: { items: CalendarItem[] }) {
  // The CMS's sessions, read once by the page and handed to both the sections
  // that need them. See the note there.
  const { days, span } = weekBoard(items);
  if (days.every((d) => d.lead.length === 0)) return null;

  return (
    <section
      id="the-week"
      aria-labelledby="week-board-heading"
      className="border-t border-white/10 bg-black"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Sept 28 – Oct 2
            </p>
            <h2
              id="week-board-heading"
              className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl"
            >
              Five days.{" "}
              <span className="whitespace-nowrap text-magenta">
                Five circuits.
              </span>
            </h2>
            {/* The headline counted the week — "20 ways in" — which was a
                number the CMS moves. Twenty becomes forty the week TPR's
                sessions land, and a headline that has to be right about a
                figure nobody is watching is a headline waiting to be wrong.
                The circuits are the fixed fact: there are five, they are the
                brand's own vocabulary, and they are what the schedule filters
                by.

                So the variety goes in the standfirst, where it can name the
                kinds of thing on offer without counting them, and free — the
                fact that decides whether a stranger reads on, and the one
                neither the board nor the button says. */}
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              Keynotes and pitch nights, workshops and community meetups, and
              the socials after — every room running its own week, and every
              session free.
            </p>
          </div>
          {/* `ButtonLink`, in magenta, at the size and face the other two
              homepage sections use.
              
              It was a bespoke white pill — its own radius, its own fill, its
              own type — which is how it ended up with a silhouette that means
              "tag" everywhere else on the site. Magenta is this site's primary
              action: the navbar's "Get involved" is magenta, and so are "Trace
              the schedule" and "Meet the full lineup" directly below. A white
              button beside three magenta ones does not read as more important,
              it reads as a different kind of control.
              
              What gives this section its primacy is where it sits and what it
              is — the first thing under the hero, and the week itself. It does
              not need a colour nobody else has. Using the component rather
              than copying its look is the same lesson the marks refactor
              taught: a hand-rolled copy is a thing that drifts. */}
          <ButtonLink
            href="/schedule"
            size="md"
            className="group mt-2 justify-self-start font-display text-base font-bold uppercase tracking-tight duration-200 lg:mt-0 lg:h-13 lg:px-7 lg:text-lg"
          >
            See the full schedule
            <ArrowUpRight
              className={cn(
                ARROW_MOTION,
                "size-5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </ButtonLink>
        </div>

        {/* Labelled, the way the schedule labels it. The bar carries a logo
            and a date range and nothing that says what it is spanning; the
            eyebrow is what turns it from a banner over the week into a row of
            the same table. */}
        {span && (
          <div className="mt-8">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/45">
              All week
            </p>
            <SpanBar span={span} />
          </div>
        )}

        {/* Five columns from lg, where they all fit at once — which is the
            whole point of a snapshot. Below that they become a snap rail
            rather than a grid: five columns on a phone is five slivers, and a
            stacked list stops being a week. */}
        <div className="-mx-6 mt-4 overflow-x-auto px-6 pb-2 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max snap-x gap-3 lg:grid lg:w-auto lg:grid-cols-5 lg:gap-4">
            {days.map((d) => (
              <DayColumn key={d.iso} day={d} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
