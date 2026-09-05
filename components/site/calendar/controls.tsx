"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, Search, X } from "lucide-react";
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
  query = null,
  onCircuit,
  onVenue,
  onQuery,
  layout = "auto",
}: {
  circuits: Option[];
  venues: Option[];
  circuit: string | null;
  venue: string | null;
  /**
   * The free-text cut, where the caller has one.
   *
   * Optional because the speakers page shares this component and does not
   * search: its haystack is a person's name, role and company, which is a
   * different index from a session's, and one field that means two things
   * would be worse than two fields that each mean one. Without `onQuery` no
   * box is drawn — the schedule opts in, the speaker wall does not.
   */
  query?: string | null;
  onCircuit: (next: string | null) => void;
  onVenue: (next: string | null) => void;
  onQuery?: (next: string | null) => void;
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
  layout?: "auto" | "stacked" | "compact";
}) {
  // One row of selects at every width. The week view has the horizontal room
  // for chips and spends 70px of vertical on them — which it does not have,
  // since the grid below is the thing that has to fit on screen. Having the
  // width is not the same as it being worth the height.
  if (layout === "compact") {
    return (
      // `max-w-md` was sized for a control block that had the row to itself.
      // In the merged bar the two selects share the row with the view toggle,
      // and 28rem across two of them clipped the longer label to "All
      // circui…". They size to their own content now; the row wraps if it
      // ever has to.
      // A column on a phone, a row from lg.
      //
      // Wrapping was the wrong mechanism below lg. Three controls each sized
      // to their own content — 256px for the search, 248px for either select
      // — do not fit a 342px content box, so every one of them took a line of
      // its own and none of them reached the right edge: three boxes of two
      // different widths stacked down the left, 124px of ragged controls
      // before the first session. Stated as a column instead, the search takes
      // the full measure and the two selects share one row, which is 82px and
      // has an edge.
      <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap">
        {/* From lg it is wider than the selects and does not shrink to match
            them: what is typed here is a name, and a name clipped to "sandra
            vela…" in the field that found it is a control arguing with its own
            result. On a phone it takes the whole measure for the same reason. */}
        {onQuery && (
          <SearchField
            value={query}
            onChange={onQuery}
            className="w-full lg:w-64"
          />
        )}
        <div className="flex gap-2 lg:contents">
          <FilterSelect
            label="Circuit"
            placeholder="All circuits"
            options={circuits}
            value={circuit}
            onChange={onCircuit}
            // Half the row each below lg, where the 15.5rem floor cannot hold
            // — two of those is 496px on a 342px screen. At 167px apiece the
            // triggers still clear "All circuits" and "All rooms" unclipped;
            // a long selection truncates, which the magenta edge covers for.
            // From lg the wrapper is `contents`, so these become children of
            // the row itself again and take the floor back.
            className="min-w-0 flex-1 lg:min-w-[15.5rem] lg:flex-none"
          />
          <FilterSelect
            label="Venue"
            placeholder="All rooms"
            options={venues}
            value={venue}
            onChange={onVenue}
            className="min-w-0 flex-1 lg:min-w-[15.5rem] lg:flex-none"
          />
        </div>
      </div>
    );
  }
  if (layout === "stacked") {
    return (
      <div className="flex flex-col gap-2">
        {onQuery && <SearchField value={query} onChange={onQuery} />}
        {/* Stacked is the 20rem sticky column's shape, and only from lg does
            the column exist. Below it this block runs the full measure, where
            three boxes down the page is 124px for what fits in 82 — so the
            selects share a row there, exactly as they do in `compact`. */}
        <div className="flex gap-2 lg:contents">
          <FilterSelect
            label="Circuit"
            placeholder="All circuits"
            options={circuits}
            value={circuit}
            onChange={onCircuit}
            className="min-w-0 flex-1 lg:min-w-[15.5rem] lg:flex-none"
          />
          <FilterSelect
            label="Venue"
            placeholder="All rooms"
            options={venues}
            value={venue}
            onChange={onVenue}
            className="min-w-0 flex-1 lg:min-w-[15.5rem] lg:flex-none"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Its own row at every width here. Below lg the two selects already
          share one 36px line and a third control on it would leave each about
          110px; from lg the filters are chips, and a text field parked at the
          end of a chip row reads as another chip. */}
      {onQuery && (
        <SearchField value={query} onChange={onQuery} className="max-w-md" />
      )}

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

/**
 * The free-text cut, in the same 36px row the selects run at.
 *
 * A third control is not free, and it earns the room by doing the thing the
 * other two cannot: the selects narrow by circuit and by room, and on a day
 * where twenty sessions share one room and two circuits, both of them return
 * almost everything. See lib/calendar-search for what it matches and why it
 * is not fuzzy.
 *
 * First in every layout, ahead of the selects. It is the broadest cut of the
 * three — it can reach a speaker, a room, a strand and a sponsor at once —
 * and the row should read from wide to narrow.
 */
function SearchField({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search sessions
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value ?? ""}
        // The empty string is "no filter" — the same contract the selects
        // keep, so an emptied box drops out of the URL instead of leaving
        // `?q=` on the address people copy.
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value)
        }
        onKeyDown={(e) => {
          // Escape clears rather than blurring. A reader who has narrowed the
          // week to one speaker wants the week back, and the browser's own
          // search-input clear button is invisible until the field is hovered.
          if (e.key === "Escape" && value !== null) {
            e.preventDefault();
            onChange(null);
          }
        }}
        placeholder="Search speakers, sessions"
        className={cn(
          // Matched to Combobox's `sm` trigger, down to the /40 border —
          // WCAG 1.4.11 wants 3:1 on a boundary that identifies a control.
          "h-9 w-full rounded-md border bg-black pl-9 pr-9 text-sm text-white transition-colors",
          "border-white/40 placeholder:text-white/60 hover:border-magenta/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-1",
          // The magenta edge a set filter takes, the same as FilterSelect's.
          value !== null && "border-magenta",
          // Safari draws its own clear affordance inside a `type="search"`
          // field, which would sit under ours.
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-white/60 transition-colors hover:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  onChange: (next: string | null) => void;
  /** Overrides the width floor below — see the note on it. */
  className?: string;
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
    // `flex-1` and `min-w-0` were for the old block, where two selects split
    // a `max-w-md` row and had to share it evenly. In the merged control bar
    // they made each one shrink to half of whatever was left, which is what
    // clipped "All circuits" to "All circui…". They size to their label now.
    // A floor, so picking a filter doesn't move the one beside it.
    //
    // The trigger sizes to its content, which is why nothing was clipping —
    // but it also means the box grows when a value is chosen: measured, the
    // circuits trigger goes from "All circuits" to 242px on "Small Business &
    // Solopreneur", shoving the rooms select 80px to the right as you use it.
    // 15.5rem clears the longest option in either list, so both boxes are the
    // width they will ever need and the row holds still.
    <div className={cn("min-w-[15.5rem]", className)}>
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

/*
  The view is NOT persisted, and that is a fix rather than an omission.

  It was, in localStorage, read through useSyncExternalStore the way the picks
  are. That works for the picks and cannot work for this: /schedule is
  prerendered, so the server writes HTML for whichever view the default names,
  and the server has no way to know what a particular browser last chose. The
  client then reads storage and corrects it — measured at six frames, roughly
  360ms of the week visibly rendering before it flipped to the agenda, on every
  single load.

  No pre-paint script fixes it either, which is the part worth recording. The
  theme-flicker trick works because a theme is entirely expressible in CSS: set
  a class on <html> before paint and the same markup renders either way. A view
  is a different *branch* — only one is ever in the DOM — so hiding the
  mismatch would mean rendering both calendars on every request and letting CSS
  pick, paying for a whole second grid to avoid one frame.

  So the URL is the only override. It survives sharing, which is the case that
  actually mattered ("here's the whole week laid out"), and it can never
  disagree with the server. What it gives up is a returning reader's standing
  preference — acceptable now the default is the right view for a first visit
  rather than a guess.

  The alternative, if that preference is wanted back, is a cookie: readable on
  the server, so the correct view is prerendered and nothing flashes. It costs
  this page its static rendering, which is why it is not the choice here.
*/

/**
 * Which rendering of the week is on screen.
 *
 * The query string, or the week. See the note above for why there is no third
 * source any more.
 *
 * The week is the default, and the agenda was first. That choice was made when
 * the grid did not fit — its bottom edge sat 321px below the fold on a
 * MacBook Air, so the one view that can show four venues running at once could
 * not show it without scrolling. It fits now, and three things followed: the
 * hero took the headline "Five days, one current." and a CTA reading "See the
 * week", the grid gained the marks and flourishes the rows had, and the bento
 * below it went, leaving the calendar as the page. Landing on a day-by-day
 * list after all that was the section answering a question the hero had not
 * asked.
 *
 * The default only shapes a first visit — storage remembers every one after —
 * so it should be the view that keeps the promise made above it.
 *
 * A toggle rather than a drawer, and rather than a second route. A drawer
 * would trap the grid behind an overlay whose links navigate away from it,
 * and it could not be linked at all. A route would split one week across two
 * pages, each holding the same filters and the same selection.
 */
export function useWeekView(): [WeekView, (next: WeekView) => void] {
  const params = useSearchParams();
  const fromUrl = params.get("view");
  const view: WeekView =
    fromUrl === "week" || fromUrl === "agenda" ? fromUrl : "week";

  const set = React.useCallback((next: WeekView) => {
    const p = new URLSearchParams(window.location.search);
    // The default view leaves no trace in the URL — a bare /schedule and
    // /schedule?view=week are the same page, and only one of them should be
    // the address people copy. Inverted along with the default: the week is
    // now what a bare /schedule shows, so the agenda is the one that has to
    // say so.
    if (next === "week") p.delete("view");
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
        // 12px, not 10, and a wider pill. This is the primary view switch for
        // the whole schedule — it decides which of two layouts the page is —
        // and it was the smallest type on it: 10px against 16px filter
        // selects, 16px intro copy and 20px day names. The one control that
        // changes everything was set below the things it changes.
        //
        // The size also settles a question the colour kept raising. `magenta`
        // at 53×31px on pure black reads red: a small, highly saturated patch
        // loses its hue, and the surrounding black pushes what is left warm.
        // It is the same #ff32a0 as the headline accent, which reads pink
        // because it is larger and has white around it. More area is the fix
        // that keeps the value.
        "hidden overflow-hidden rounded-md border border-white/20 font-mono text-xs uppercase tracking-widest lg:inline-flex",
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
              "whitespace-nowrap px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta",
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
