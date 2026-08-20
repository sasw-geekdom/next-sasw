"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

// The controls both calendar views share: the filter chips, the state that
// backs them, and the selection bar.

export interface Option {
  value: string;
  label: string;
}

/**
 * A filter that lives in the URL.
 *
 * Filters became worth linking the moment they became the zoom control rather
 * than a way to hide rows: "here's the AI circuit" and "here's everything at
 * TPR" are the two things an organiser will want to send someone, and neither
 * was addressable while this was `useState`.
 *
 * `history.replaceState` rather than `router.replace`, which Next supports
 * explicitly for this and which keeps a statically rendered page static —
 * a `router.replace` would ask the server for a route that has nothing new to
 * say. Replace, not push, so a filter toggle doesn't put a stop on the back
 * button between the reader and the page they arrived from.
 *
 * Initial value comes from `useSearchParams`, which forces the subtree into a
 * Suspense boundary during prerender; the calendar's server half supplies one.
 */
export function useUrlFilter(
  key: string,
): [string | null, (next: string | null) => void] {
  const params = useSearchParams();
  const [value, setValue] = React.useState<string | null>(
    () => params.get(key) ?? null,
  );

  const set = React.useCallback(
    (next: string | null) => {
      setValue(next);
      // Read the live query string rather than closing over one, so two
      // filters changed in sequence compose instead of overwriting each other.
      const p = new URLSearchParams(window.location.search);
      if (next === null) p.delete(key);
      else p.set(key, next);
      const qs = p.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `?${qs}` : window.location.pathname,
      );
    },
    [key],
  );

  return [value, set];
}

const PICKED_KEY = "sastw:my-week";

/** Stable reference, so the server snapshot never looks like a change. */
const NO_PICKS: string[] = [];

// `localStorage` is an external store, so it is read through
// useSyncExternalStore rather than copied into state inside an effect. That is
// what React 19's `react-hooks/set-state-in-effect` rule is asking for, and it
// is also simply correct here: seeding state from storage in an effect renders
// once with an empty selection and once with the real one, and reading it in
// the initialiser doesn't work at all, because there is no `window` during
// prerender.
//
// Snapshots have to be referentially stable or React re-renders forever, hence
// the cache: the parsed array is rebuilt only when the raw string changes.

let cache: { raw: string | null; value: string[] } = {
  raw: null,
  value: NO_PICKS,
};
const listeners = new Set<() => void>();

function readPicked(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PICKED_KEY);
  } catch {
    // Blocked storage. The reader gets an empty selection that still works
    // for the life of the page.
  }
  if (raw !== cache.raw) {
    let value: string[] = NO_PICKS;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        value = parsed.filter((s): s is string => typeof s === "string");
      }
    } catch {
      // Corrupt entry — treat it as empty rather than breaking the page.
    }
    cache = { raw, value };
  }
  return cache.value;
}

function writePicked(next: string[]) {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(PICKED_KEY, raw);
  } catch {
    // Private mode or quota. The in-memory cache below still drives the UI.
  }
  // Seeded rather than re-read, so the next snapshot is this exact array and
  // the write is visible even where the store itself refused it.
  cache = { raw, value: next };
  for (const listener of listeners) listener();
}

function subscribePicked(onChange: () => void) {
  listeners.add(onChange);
  // `storage` fires in *other* tabs, which is the free half of this: two tabs
  // open on the schedule stay in agreement. This tab is served by the loop in
  // writePicked.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The reader's selection, kept across views and visits.
 *
 * At nine activations this was a nice-to-have and component state was fine.
 * With a week of speaker slots it becomes the main way the page is used — you
 * build a shortlist, and the shortlist has to survive clicking into a day and
 * coming back out, which is a real navigation now rather than a state change.
 */
export function usePicked() {
  const picked = React.useSyncExternalStore(
    subscribePicked,
    readPicked,
    () => NO_PICKS,
  );

  const toggle = React.useCallback((slug: string) => {
    const current = readPicked();
    writePicked(
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug],
    );
  }, []);

  const clear = React.useCallback(() => writePicked(NO_PICKS), []);

  return { picked, toggle, clear };
}

/**
 * The two filters, in the form each screen has room for.
 *
 * Chips from lg, where ten of them fit on two lines and showing the vocabulary
 * is worth the space — the point of the row is partly to say that the five
 * circuits exist. On a phone that same row cost 254px and pushed Monday below
 * the fold, and the two ways out of that both had a real flaw: wrapping was
 * what we were escaping, and a horizontal scroller hides half the options
 * behind a gesture with only a fade to hint at it.
 *
 * So below lg they collapse to two selects sharing one 36px row. Nothing is
 * off-screen, the trigger states the current filter as its own label — better
 * feedback than a filled chip that may have scrolled out of view — and the
 * search box appears on its own once either list passes seven, which is where
 * a plain select stops being scannable.
 *
 * One component rather than two `FilterRow`s so the selects can share a row;
 * stacked they would have cost the two rows this was meant to save.
 */
export function Filters({
  circuits,
  venues,
  circuit,
  venue,
  onCircuit,
  onVenue,
  layout = "auto",
}: {
  circuits: Option[];
  venues: Option[];
  circuit: string | null;
  venue: string | null;
  onCircuit: (next: string | null) => void;
  onVenue: (next: string | null) => void;
  /**
   * "auto" is the full-width case: selects on a phone, chips from lg, where
   * there is room to show the vocabulary.
   *
   * "stacked" is the agenda's sticky column, which is 20rem wide. Ten chips
   * do not fit in that — "Small Business & Solopreneur" alone nearly fills it
   * — and the column has to stay under the viewport height or the pin has
   * nowhere to go. So the selects run at every size there, one above the
   * other rather than side by side.
   */
  layout?: "auto" | "stacked";
}) {
  if (layout === "stacked") {
    return (
      <div className="flex flex-col gap-2">
        <FilterSelect
          label="Circuit"
          placeholder="All circuits"
          options={circuits}
          value={circuit}
          onChange={onCircuit}
        />
        <FilterSelect
          label="Venue"
          placeholder="All rooms"
          options={venues}
          value={venue}
          onChange={onVenue}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 lg:hidden">
        <FilterSelect
          label="Circuit"
          placeholder="All circuits"
          options={circuits}
          value={circuit}
          onChange={onCircuit}
        />
        <FilterSelect
          label="Venue"
          placeholder="All rooms"
          options={venues}
          value={venue}
          onChange={onVenue}
        />
      </div>

      <div className="hidden flex-col gap-3 lg:flex">
        <FilterRow
          legend="Circuit"
          options={circuits}
          value={circuit}
          onChange={onCircuit}
        />
        <FilterRow
          legend="Venue"
          options={venues}
          value={venue}
          onChange={onVenue}
        />
      </div>
    </>
  );
}

function FilterSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const id = React.useId();
  // The empty string is "no filter". Combobox speaks in strings and `null`
  // isn't one, so the cleared state needs a real option to sit on — which it
  // wants anyway, since a select with no way back to "all" is a trap.
  const withAll = React.useMemo(
    () => [{ value: "", label: placeholder }, ...options],
    [options, placeholder],
  );
  return (
    <div className="min-w-0 flex-1">
      {/* The trigger's text is the placeholder or the selection, so "All
          circuits" and "All rooms" already read as names — but only while
          nothing is chosen. Once one is, the trigger says "Capital" and
          nothing on screen says what kind of thing that is. */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Combobox
        id={id}
        tone="dark"
        size="sm"
        // A set filter takes the magenta edge, the way the desktop chip takes
        // the magenta fill — "charge, not hue". Without it the only signal
        // that a filter is on is the trigger reading "Capital" instead of
        // "All circuits", which is a difference you have to already know to
        // notice. Reached through the wrapper rather than by widening
        // Combobox's API for one caller's visual state.
        className={cn(value !== null && "[&>button]:border-magenta")}
        options={withAll}
        value={value ?? ""}
        onChange={(next) => onChange(next === "" ? null : next)}
        placeholder={placeholder}
      />
    </div>
  );
}

export type WeekView = "agenda" | "week";

const VIEW_KEY = "sastw:week-view";

// The remembered view, read the same way the picks are — through
// useSyncExternalStore rather than an effect, so there is no render with the
// wrong answer and no setState inside an effect for the lint rule to object to.
let viewCache: WeekView | null = null;
let viewRead = false;
const viewListeners = new Set<() => void>();

function readStoredView(): WeekView | null {
  if (!viewRead) {
    viewRead = true;
    try {
      const raw = window.localStorage.getItem(VIEW_KEY);
      viewCache = raw === "week" || raw === "agenda" ? raw : null;
    } catch {
      viewCache = null;
    }
  }
  return viewCache;
}

function writeStoredView(next: WeekView) {
  viewCache = next;
  viewRead = true;
  try {
    window.localStorage.setItem(VIEW_KEY, next);
  } catch {
    // Blocked storage. The choice still holds for this page, and the URL
    // carries it anyway.
  }
  for (const listener of viewListeners) listener();
}

function subscribeView(onChange: () => void) {
  viewListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    viewListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Which rendering of the week is on screen.
 *
 * Three sources, in order: the query string, then what this browser last
 * chose, then the agenda. The URL wins so a shared link always shows the
 * sender what they saw — "here's the whole week laid out" is the thing the
 * grid is for, and it has to be sendable. Storage catches the rest, so a
 * reader who prefers the grid gets it on the next visit without a link.
 *
 * A toggle rather than a drawer, and rather than a second route. A drawer
 * would trap the grid behind an overlay whose links navigate away from it,
 * and it could not be linked at all. A route would split one week across two
 * pages, each holding the same filters and the same selection.
 */
export function useWeekView(): [WeekView, (next: WeekView) => void] {
  const params = useSearchParams();
  const fromUrl = params.get("view");
  const stored = React.useSyncExternalStore(
    subscribeView,
    readStoredView,
    () => null,
  );

  const view: WeekView =
    fromUrl === "week" || fromUrl === "agenda" ? fromUrl : (stored ?? "agenda");

  const set = React.useCallback((next: WeekView) => {
    writeStoredView(next);
    const p = new URLSearchParams(window.location.search);
    // The default view leaves no trace in the URL — a bare /schedule and
    // /schedule?view=agenda are the same page, and only one of them should be
    // the address people copy.
    if (next === "agenda") p.delete("view");
    else p.set("view", next);
    const qs = p.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname,
    );
  }, []);

  return [view, set];
}

/**
 * Agenda or grid, as a segmented control.
 *
 * Desktop only. The hour grid was never readable on a phone — five columns on
 * a 390px screen is what the whole mobile stack exists to avoid — so offering
 * the choice there would be offering a broken option.
 *
 * Same shape as the day rail, because it is the same kind of decision: a set
 * of views, one of them current, magenta on the one you are in.
 */
export function ViewToggle({
  view,
  onChange,
  className,
}: {
  view: WeekView;
  onChange: (next: WeekView) => void;
  className?: string;
}) {
  const options: { value: WeekView; label: string }[] = [
    { value: "agenda", label: "Agenda" },
    { value: "week", label: "Week" },
  ];
  return (
    <div
      className={cn(
        "hidden overflow-hidden rounded-md border border-white/20 font-mono text-[10px] uppercase tracking-widest lg:inline-flex",
        className,
      )}
      role="group"
      aria-label="Schedule layout"
    >
      {options.map((option, i) => {
        const current = option.value === view;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={current}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta",
              i > 0 && "border-l border-white/20",
              current
                ? "bg-magenta text-black"
                : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterRow({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Option[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    // One row that scrolls on a phone, wrapping only where there is width to
    // wrap into. Wrapping at 390px cost 254px for ten chips — four lines of
    // circuits and three of venues — which put the first day of the schedule
    // below the fold on a control the reader hasn't decided to use yet.
    // Scrolling spends 34px a row and keeps every chip reachable.
    //
    // `min-w-0` is load-bearing, and specifically on the fieldset. A fieldset
    // carries a UA default of `min-inline-size: min-content`, so it refuses to
    // shrink below the combined width of its chips no matter what the child
    // does — the inner scroller then never has less width than its content,
    // never scrolls, and simply runs off the side of the phone. It measured
    // 814px inside a 390px viewport.
    <fieldset className="flex min-w-0 items-center gap-2">
      <legend className="sr-only">Filter by {legend.toLowerCase()}</legend>
      <span
        aria-hidden="true"
        // /55, not the /40-/45 used for captions elsewhere on this page. This
        // one names what a control does rather than annotating content, and
        // /40 measured 3.66:1 — under AA for text this size.
        className="mr-1 w-14 shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/55"
      >
        {legend}
      </span>

      {/* The scroller, with the legend left outside it so it stays put while
          the chips move. `min-w-0` or the flex child refuses to shrink below
          its content and the row overflows the section instead. */}
      <div
        className={cn(
          "flex min-w-0 gap-2 overflow-x-auto py-0.5",
          // Bleeds past the section's px-6 to the screen edge, and fades the
          // last centimetre. Clipped flush at the padding instead, a chip
          // ended mid-word against nothing — which reads as broken type
          // rather than as a row that keeps going. The fade is the only
          // affordance a touch scroller gets, since there's no cursor to
          // change and the scrollbar is hidden.
          // Bleeds past the section's px-6 to the screen edge and fades the last
          // 2.5rem. Clipped flush at the padding instead, a chip ended mid-word
          // against nothing, which reads as broken type rather than as a row
          // that keeps going — and a hidden scrollbar leaves the fade as the
          // only affordance there is. Safari wants the prefixed property too.
          "-mr-6 pr-6",
          "[mask-image:linear-gradient(to_right,black_calc(100%_-_2.5rem),transparent)]",
          "[-webkit-mask-image:linear-gradient(to_right,black_calc(100%_-_2.5rem),transparent)]",
          // None of which applies once there's width to wrap into.
          "lg:mr-0 lg:flex-wrap lg:overflow-visible lg:pr-0 lg:[mask-image:none] lg:[-webkit-mask-image:none]",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              // Toggle rather than radio: clicking the active chip clears it,
              // so getting back to the whole week never needs a control of its
              // own.
              aria-pressed={active}
              onClick={() => onChange(active ? null : o.value)}
              className={cn(
                // `shrink-0` so a chip keeps its width inside the scroller
                // rather than being squeezed to its first word.
                "shrink-0 whitespace-nowrap",
                // Matched to /speakers' FilterChip (speaker-wall.tsx), the
                // same control on the same kind of page. The two were written
                // separately and drifted; the older, more-linked page won.
                //
                // The pill is house style, not an import: circuit chips are
                // `rounded-full` in room-flow, session-bento, speaker-card and
                // both [slug] pages.
                "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                active
                  ? // Charge, not hue — the selected chip is the one at full
                    // current.
                    "border-magenta bg-magenta text-black"
                  : // /40, not the /10 used for section seams: WCAG 1.4.11
                    // wants 3:1 for a boundary that identifies a control. /30
                    // measures 2.48:1 and fails, /40 gives 3.66:1.
                    "border-white/40 text-white/70 hover:border-magenta/60 hover:text-white",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The selection, and the way out of it.
 *
 * Sticky rather than parked under the grid: on a tall display the whole week
 * is on screen at once and the bar would sit below the fold the entire time
 * someone is building a selection at the top of it.
 *
 * One .ics carrying every picked activation, rather than a menu per block.
 * The per-session pages already hold the four-destination menu for the
 * one-event case; what this page is for is choosing several.
 */
export function ExportBar({
  picked,
  onClear,
  /** Anything picked that the current filter or view has hidden. */
  hidden = 0,
}: {
  picked: string[];
  onClear: () => void;
  hidden?: number;
}) {
  if (picked.length === 0) return null;
  // `picked` is the whole selection and always what the file carries; `hidden`
  // only says how much of it this view isn't showing.
  const total = picked.length;
  return (
    <div className="sticky bottom-4 z-30 mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-magenta/50 bg-black/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-black/70">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white">
        {total} {total === 1 ? "activation" : "activations"}{" "}
        <span className="text-white/50">on your calendar</span>
        {/* The selection outlives the filter and the view now, so a count
            that only reported what's on screen would drop every time someone
            filtered — and the file would still carry them. */}
        {hidden > 0 && (
          // "Outside this view" rather than "not shown here", which read as a
          // contradiction when every pick was hidden: "1 activation on your
          // calendar · 1 not shown here" sounds like the count is wrong. The
          // phrasing has to be true of both a filtered week and a day that
          // simply isn't the day the pick is on.
          <span className="text-white/50"> · {hidden} outside this view</span>
        )}
      </p>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[11px] uppercase tracking-widest text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Clear
        </button>
        <a
          // A plain anchor, not a Link: this is a file, and prefetching a
          // route handler that builds one is wasted work.
          href={`/schedule/export.ics?s=${[...picked].join(",")}`}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-magenta px-4 font-medium text-white transition-colors hover:bg-magenta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <CalendarPlus className="size-4" />
          Charge your calendar
        </a>
      </div>
    </div>
  );
}
