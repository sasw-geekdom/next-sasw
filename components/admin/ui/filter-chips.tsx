"use client";

import { cn } from "@/lib/utils";

export interface FilterChip<K extends string> {
  key: K;
  label: string;
  count: number;
}

/**
 * The segmented control the admin tables cut a list with.
 *
 * Extracted because there were two copies of it — registrations and
 * get-involved had the same markup pasted twice, and the combobox's own note
 * already cites "the two filter-chip implementations" as the drift it was
 * built to avoid. Now there is one.
 *
 * Sized to the portal's scale rather than the site's — see `controls.tsx`. The
 * active segment is the house black, which is both what the brand does with a
 * primary and what this kind of console does with a selected state; magenta
 * stays on focus rings and on the one active thing per screen.
 */
export function FilterChips<K extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: K;
  onChange: (key: K) => void;
  options: readonly FilterChip<K>[];
  className?: string;
}) {
  return (
    <div
      role="group"
      className={cn(
        "flex h-9 items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={cn(
              "h-8 rounded px-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                active ? "text-white/60" : "text-muted-foreground/60",
              )}
            >
              {o.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A single filter that is on or off, with its count.
 *
 * The binary dimensions — first-timer, checked in — were dropdowns, which is a
 * menu to choose between two things. As chips they are one click, they size to
 * their label, and the count is on screen instead of behind an open state:
 * "First-timers 189" against 274 registrations is a finding, not just a
 * control, and a menu would have hidden it.
 *
 * Mutually exclusive within a pair without being a radio group — pressing the
 * active one clears it, which is how you get back to "either" without a third
 * "All" chip for every pair.
 */
export function ToggleChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "h-9 rounded-md border px-2.5 text-sm font-medium transition-colors",
        pressed
          ? "border-foreground bg-foreground text-white"
          : "border-border bg-white text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 tabular-nums",
          pressed ? "text-white/60" : "text-muted-foreground/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}
