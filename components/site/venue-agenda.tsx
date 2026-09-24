import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark, markKind } from "@/components/site/calendar/marks";
import type { CalendarBrand } from "@/lib/schedule";
import { cn } from "@/lib/utils";

/**
 * One room's week as a running order.
 *
 * The venue page used to draw a day in two shapes at once: activations as
 * bento cards and the room's own talks as rows under them, so a Tuesday at The
 * Rand was four large cards and a line of text, and the eye had no single
 * column to read down. Now every day is one list, in time order, and the
 * shape of a row follows what is behind it — the same grammar as the per-room
 * day cards the week posts on social (tools/social-cards, venue-day.html):
 *
 * - A community hour with one talk: the group's mark over the talk.
 * - An afternoon with several (Access Granted, The Model, PySanAntonio): the
 *   mark heads the block once, and each talk takes its own row and time.
 * - A block with nothing inside it (College Night, Mission Pitch): its title
 *   and the one-liner from its own page.
 * - A talk that belongs to nobody but the week: title, people, circuit.
 */

export interface AgendaTalk {
  key: string;
  startMin: number;
  title: string;
  href: string | null;
  people?: string;
  circuit?: string;
}

export type AgendaEntry =
  | {
      kind: "block";
      key: string;
      /** Absent for a block with no clock of its own — a span, or TBC. */
      startMin?: number;
      timeLabel: string;
      title: string;
      href: string | null;
      brand?: CalendarBrand;
      blurb?: string;
      circuit?: string;
      talks: AgendaTalk[];
      /** What runs the whole block rather than to a clock — the village. */
      continuous: { name: string; by?: string }[];
    }
  | ({ kind: "talk" } & AgendaTalk);

export interface AgendaDay {
  iso: string;
  weekday: string;
  label: string;
  entries: AgendaEntry[];
}

/** "1:10" and "PM", from minutes past midnight — the day cards' time column. */
function clock(min: number): [string, string] {
  const h = Math.floor(min / 60);
  return [`${h % 12 || 12}:${String(min % 60).padStart(2, "0")}`, h < 12 ? "AM" : "PM"];
}

function Time({ min, label }: { min?: number; label?: string }) {
  if (min === undefined) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-magenta/80">
        {label}
      </p>
    );
  }
  const [t, ap] = clock(min);
  return (
    <p className="font-mono text-base text-magenta tabular-nums">
      {t}
      <span className="ml-1 text-[10px] tracking-widest text-magenta/70">{ap}</span>
    </p>
  );
}

/** A row's arrow — the house's affordance that the whole row leads somewhere. */
function Arrow() {
  return (
    <ArrowUpRight
      className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-magenta"
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

/**
 * A title that is the row's link, stretched over the row via `::after` the
 * way the grid blocks do it — a line of display type is a small target and the
 * time beside it is part of the same thing.
 */
function RowTitle({
  href,
  children,
  size = "lg",
}: {
  href: string | null;
  children: React.ReactNode;
  size?: "lg" | "md";
}) {
  const type = cn(
    "block text-pretty font-display font-bold uppercase leading-[1.05] tracking-tight text-white",
    // A step smaller on a phone: at text-xl the longer titles ran to five
    // lines in the 340px column beside the time.
    size === "lg" ? "text-lg sm:text-2xl" : "text-base sm:text-xl",
  );
  if (!href) return <p className={type}>{children}</p>;
  return (
    <Link
      href={href}
      className={cn(
        type,
        "transition-colors duration-200 after:absolute after:inset-0 group-hover:text-magenta focus-visible:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta",
      )}
    >
      {children}
    </Link>
  );
}

function Meta({ people, circuit }: { people?: string; circuit?: string }) {
  if (!people && !circuit) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {people && <span className="text-pretty text-sm text-white/65">{people}</span>}
      {circuit && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          {circuit}
        </span>
      )}
    </p>
  );
}

/** The group's mark, as the calendar draws it — lockup file or typeset. */
function Mark({ brand, title }: { brand: CalendarBrand; title: string }) {
  const kind = markKind(brand, false, "md");
  if (!kind) return null;
  return (
    <div className="flex min-h-8 items-center">
      <BrandMark brand={brand} title={title} dense={false} size="md" kind={kind} />
    </div>
  );
}

const ROW = "group relative grid grid-cols-[4.75rem_1fr_auto] items-baseline gap-x-4 py-5 sm:grid-cols-[6rem_1fr_auto] sm:gap-x-6";

function TalkRow({
  talk,
  nested = false,
}: {
  talk: AgendaTalk;
  nested?: boolean;
}) {
  return (
    <li className={cn(ROW, nested ? "py-3.5" : "border-t border-white/10")}>
      <Time min={talk.startMin} />
      <div className="min-w-0">
        <RowTitle href={talk.href} size={nested ? "md" : "lg"}>
          {talk.title}
        </RowTitle>
        <Meta people={talk.people} circuit={nested ? undefined : talk.circuit} />
      </div>
      {talk.href ? <Arrow /> : <span />}
    </li>
  );
}

function Block({ entry }: { entry: Extract<AgendaEntry, { kind: "block" }> }) {
  const mark = entry.brand ? <Mark brand={entry.brand} title={entry.title} /> : null;
  const one = entry.talks.length === 1 && entry.continuous.length === 0;

  // A community hour with one talk: the mark over the talk, one row.
  if (one) {
    const talk = entry.talks[0];
    return (
      <li className={cn(ROW, "border-t border-white/10")}>
        <Time min={entry.startMin} label={entry.timeLabel} />
        <div className="min-w-0">
          {mark ?? (
            <p className="font-mono text-[11px] uppercase tracking-widest text-magenta">
              {entry.title}
            </p>
          )}
          <div className="mt-2.5">
            <RowTitle href={talk.href}>{talk.title}</RowTitle>
            <Meta people={talk.people} circuit={entry.circuit} />
          </div>
        </div>
        {talk.href ? <Arrow /> : <span />}
      </li>
    );
  }

  // Nothing inside it: the block is its own title, with its page's one-liner.
  // No mark here — it would say the title twice ("College Night" set in type,
  // then "College Night" as the heading). The mark earns its place where it
  // heads something else.
  if (entry.talks.length === 0) {
    return (
      <li className={cn(ROW, "border-t border-white/10")}>
        <Time min={entry.startMin} label={entry.timeLabel} />
        <div className="min-w-0">
          <RowTitle href={entry.href}>{entry.title}</RowTitle>
          {entry.blurb && (
            <p className="mt-1.5 max-w-2xl text-pretty text-sm text-white/60">
              {entry.blurb}
            </p>
          )}
          <Meta circuit={entry.circuit} />
        </div>
        {entry.href ? <Arrow /> : <span />}
      </li>
    );
  }

  // An afternoon: the mark heads it once, the talks follow with their own
  // times, and anything that runs the whole block closes it.
  return (
    <li className="border-t border-white/10">
      <div className="group relative grid grid-cols-[4.75rem_1fr_auto] items-center gap-x-4 pt-5 pb-2 sm:grid-cols-[6rem_1fr_auto] sm:gap-x-6">
        <span />
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          {entry.href ? (
            <Link
              href={entry.href}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
              aria-label={entry.title}
            >
              {mark ?? (
                <span className="font-display text-xl font-bold uppercase text-white">
                  {entry.title}
                </span>
              )}
            </Link>
          ) : (
            mark
          )}
          <span className="font-mono text-[11px] uppercase tracking-widest text-white/50">
            {entry.timeLabel}
          </span>
        </div>
        {entry.href ? <Arrow /> : <span />}
      </div>
      <ol className="pb-3">
        {entry.talks.map((t) => (
          <TalkRow key={t.key} talk={t} nested />
        ))}
        {entry.continuous.map((c) => (
          <li key={c.name} className={cn(ROW, "py-3.5")}>
            <Time label={entry.timeLabel} />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-magenta sm:text-xl">
                {c.name}
              </p>
              {c.by && (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/50">
                  Powered by <span className="text-white/80">{c.by}</span>
                </p>
              )}
            </div>
            <span />
          </li>
        ))}
      </ol>
    </li>
  );
}

export function VenueAgenda({ days }: { days: AgendaDay[] }) {
  return (
    <>
      {days.map((day) => {
        const count = day.entries.reduce(
          (n, e) =>
            n + (e.kind === "block" ? Math.max(1, e.talks.length) : 1),
          0,
        );
        return (
          <div key={day.iso} className="mt-12 lg:mt-14">
            <div className="flex items-baseline gap-3 pb-1">
              <h3 className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white sm:text-2xl">
                {day.weekday}
              </h3>
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
                {day.label} · {count} {count === 1 ? "session" : "sessions"}
              </p>
            </div>
            <ol className="mt-3 border-b border-white/10">
              {day.entries.map((e) =>
                e.kind === "block" ? (
                  <Block key={e.key} entry={e} />
                ) : (
                  <TalkRow key={e.key} talk={e} />
                ),
              )}
            </ol>
          </div>
        );
      })}
    </>
  );
}
