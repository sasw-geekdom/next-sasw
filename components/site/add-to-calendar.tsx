"use client";

import * as React from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar";
import { buttonSizes } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The same four destinations the branded emails already offer, in a menu
// instead of a row of links — Google, Apple, Outlook.com, and the raw file.
// The URL builders are shared with those emails (lib/calendar) so a fix to the
// encoding lands in both.
//
//   Google      — a template URL. Google won't take an .ics by link; it wants
//                 its own render endpoint with the event as query params.
//   Apple       — the .ics served inline, so macOS and iOS hand it straight to
//                 Calendar rather than dropping a file in Downloads.
//   Outlook.com — its own compose endpoint, for the web client.
//   Download    — the same .ics with `?download`, forcing the save. Desktop
//                 Outlook and everything else take it from here.
//
// A disclosure rather than a real ARIA menu: these are links, and `menuitem`
// semantics would promise arrow-key navigation this doesn't implement. A
// button that expands a list of links is the honest description, and it still
// closes on Escape and on outside click.

/** Four items plus padding — enough to decide which way to open. */
const MENU_HEIGHT = 140;

export function AddToCalendar({
  event,
  icsHref,
  size = "lg",
}: {
  event: CalendarEvent;
  /** This session's `.ics` route. */
  icsHref: string;
  /**
   * Matches the register button beside it by default.
   *
   * Routed through the shared scale rather than the hardcoded `h-13 px-7
   * text-lg` this used to carry — same rendered size, but it can no longer
   * drift from `lg` without anyone noticing.
   */
  size?: "md" | "lg";
}) {
  const [open, setOpen] = React.useState(false);
  const [up, setUp] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);

  /**
   * Open upward when there isn't room below.
   *
   * On a confirmed session the page is the hero and nothing else, so it's
   * often shorter than the viewport — a menu hanging off the bottom has no
   * scroll to reveal it and is simply cut off. Measured at open rather than
   * fixed, because the button sits at a different height on a laptop than on
   * a tall monitor.
   */
  const toggle = () => {
    setOpen((wasOpen) => {
      if (!wasOpen && root.current) {
        const r = root.current.getBoundingClientRect();
        setUp(window.innerHeight - r.bottom < MENU_HEIGHT + 16);
      }
      return !wasOpen;
    });
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Four one-word destinations don't need a full-size menu. Tighter than the
  // site's `text-sm` body default on purpose — this is a picker, and its rows
  // are labels rather than anything anyone reads. Still 13px, so it stays
  // comfortably above the mono captions elsewhere on the page.
  // Centred below sm, left-aligned from sm up. The panel is full width there
  // and sits under a trigger whose own label is centred, so left-aligned rows
  // read as hanging off the edge of a wide box. On desktop the panel is 160px
  // and left alignment is what makes four items scan as a list.
  const item =
    "block px-3 py-1.5 text-center text-[13px] text-white transition-colors duration-150 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none sm:text-left";

  return (
    <div ref={root} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="add-to-calendar-options"
        className={cn(
          "group inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 font-medium text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto",
          buttonSizes[size],
        )}
      >
        <CalendarPlus
          className={cn("shrink-0", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")}
          strokeWidth={2.5}
          aria-hidden="true"
        />
        Add to calendar
        <ChevronDown
          className={cn(
            "shrink-0 transition-transform duration-200 motion-reduce:transition-none",
            size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5",
            open && "rotate-180",
          )}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id="add-to-calendar-options"
          className={cn(
            // Right-aligned, so the panel hangs under the chevron that opens
            // it. Anchored left it opened from the far end of a 238px button,
            // which puts the thing you just clicked and the thing that appears
            // at opposite ends of the control.
            //
            // Full width below sm, where the trigger is too and centres its
            // label — there is no right-hand chevron to hang under, so the
            // panel matches the button instead.
            "absolute right-0 z-20 w-full overflow-hidden rounded-md border border-white/15 bg-black py-1 shadow-lg sm:w-40",
            up ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className={item}
            onClick={() => setOpen(false)}
          >
            Google Calendar
          </a>
          <a href={icsHref} className={item} onClick={() => setOpen(false)}>
            Apple Calendar
          </a>
          <a
            href={outlookCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className={item}
            onClick={() => setOpen(false)}
          >
            Outlook.com
          </a>
          <a
            href={`${icsHref}?download`}
            className={item}
            onClick={() => setOpen(false)}
          >
            Download .ics
          </a>
        </div>
      )}
    </div>
  );
}
