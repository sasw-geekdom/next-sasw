"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  size?: "sm" | "md";
  /**
   * Which ground this sits on.
   *
   * "light" is the default and what every existing caller wants — the forms
   * and the CMS are all on the site's white. "dark" exists for the schedule,
   * which is the one black surface that needs a select; the alternative was a
   * second combobox implementation, and two of these would drift the way the
   * two filter-chip implementations already did.
   */
  tone?: "light" | "dark";
}

/**
 * Ground-dependent classes, kept together so a change to one tone can't
 * silently leave the other behind.
 */
const TONES = {
  light: {
    trigger: "border-border bg-white",
    placeholder: "text-muted-foreground",
    chevron: "text-muted-foreground",
    panel: "border-border bg-white",
    search: "placeholder:text-muted-foreground",
    empty: "text-muted-foreground",
    active: "bg-muted",
    // `--magenta` is 3.38:1 on white and fails AA as text; the ink is 5.23:1.
    // See the note in globals.css.
    selected: "font-medium text-magenta-ink",
  },
  dark: {
    // /40, not the hairline used for section seams: WCAG 1.4.11 wants 3:1 for
    // a boundary that identifies a control, which is what this is.
    trigger: "border-white/40 bg-black text-white hover:border-magenta/60",
    placeholder: "text-white/60",
    chevron: "text-white/60",
    panel: "border-white/25 bg-black shadow-black/60",
    search: "text-white placeholder:text-white/40",
    empty: "text-white/50",
    active: "bg-white/10",
    // On black, plain `--magenta` measures 6.22:1 — the ink is the one that
    // fails here, at 4.01:1. The two tones want opposite values.
    selected: "font-medium text-magenta",
  },
} as const;

/**
 * Searchable single-select. Type to filter, arrow keys to move,
 * Enter to select, Escape / click-outside to close.
 * Powers speaker & moderator pickers in the CMS (Phase 5).
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "Nothing found.",
  disabled,
  className,
  id,
  size = "md",
  tone = "light",
}: ComboboxProps) {
  const t = TONES[tone];
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const selected = options.find((o) => o.value === value);
  // Only surface the search box for longer lists; short lists read as a clean select.
  const showSearch = options.length > 7;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Reset the active row whenever the visible set changes.
  React.useEffect(() => {
    setActive(0);
  }, [query, open]);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Focus the search field when the popover opens.
  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function select(option: ComboboxOption) {
    onChange?.(option.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[active]) select(filtered[active]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between rounded-md border px-3 text-left transition-colors",
          t.trigger,
          size === "sm" ? "h-9 text-sm" : "h-11 text-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("truncate", !selected && t.placeholder)}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown
          className={cn("ml-2 h-4 w-4 shrink-0", t.chevron)}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md",
            t.panel,
          )}
        >
          {showSearch && (
            <div className={cn("border-b p-2", t.panel)}>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className={cn(
                  "h-9 w-full rounded-sm bg-transparent px-2 text-sm outline-none",
                  t.search,
                )}
              />
            </div>
          )}
          <ul
            id={listId}
            role="listbox"
            className={cn(
              "overflow-y-auto p-1",
              // Short lists show whole; long ones cap and scroll. Keyed on
              // the same threshold as the search box, because it is the same
              // judgement — a list short enough to read as a plain select is
              // short enough to draw in full, and one long enough to need
              // searching needs a ceiling.
              //
              // The schedule's circuit filter is the case that prompted this:
              // six options, two of which wrap to a second line, comes to
              // ~264px and was clipped by the flat 240px cap, leaving "Social"
              // just below the fold of the panel.
              //
              // 60vh rather than no cap at all — a short list of long labels
              // can still run past the bottom of a phone in landscape.
              showSearch ? "max-h-60" : "max-h-[60vh]",
            )}
          >
            {filtered.length === 0 ? (
              <li className={cn("px-3 py-2 text-sm", t.empty)}>
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = option.value === value;
                const isActive = i === active;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => select(option)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm",
                      tone === "dark" && "text-white/80",
                      isActive && t.active,
                      isSelected && t.selected,
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-4 w-4" strokeWidth={1.5} />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
