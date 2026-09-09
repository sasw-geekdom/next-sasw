"use client";

import type { RegistrationRow } from "@/lib/admin/types";
import { summarizeRegistrations } from "@/lib/admin/registration-summary";
import { StatCard } from "@/components/admin/ui/stat-card";
import {
  EMPTY_FILTERS,
  isFiltered,
  type RegistrationFilters,
} from "@/lib/admin/registration-filters";

/**
 * The overview, which is also the filter bar.
 *
 * Pressing a card toggles the dimension it counts. The "Registered" card is the
 * exception: it clears, so the way back to everything is the first thing on the
 * row rather than a "clear filters" link hiding under a control someone has to
 * find.
 */
export function RegistrationsSummary({
  rows,
  filters,
  onChange,
}: {
  rows: RegistrationRow[];
  filters: RegistrationFilters;
  onChange: (patch: Partial<RegistrationFilters>) => void;
}) {
  const { stats, top } = summarizeRegistrations(rows);

  return (
    <section className="flex flex-col gap-3">
      {/* Flex rather than a fixed grid: the strip is five cards today and six
          once check-in starts, and a `grid-cols-6` left an empty column
          hanging off the end until the 28th. Equal basis, so they fill the row
          at whatever the count is. */}
      <div className="flex flex-wrap gap-3">
        {stats.map((s) => {
          // A card is pressed when every key it sets is already set.
          const pressed = s.patch
            ? Object.entries(s.patch).every(
                ([k, v]) => filters[k as keyof RegistrationFilters] === v,
              )
            : !isFiltered(filters);

          return (
            <StatCard
              key={s.label}
              className="min-w-[9rem] flex-1"
              label={s.label}
              value={s.value}
              pressed={pressed}
              onClick={() =>
                onChange(
                  s.patch === null
                    ? EMPTY_FILTERS
                    : pressed
                      ? // Pressing the active one clears just that dimension,
                        // which is how a toggle gets back to "either" without a
                        // second control to undo it.
                        Object.fromEntries(
                          Object.keys(s.patch).map((k) => [k, ""]),
                        )
                      : s.patch,
                )
              }
            />
          );
        })}
      </div>

      {top.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="uppercase tracking-wide">Mostly</span>{" "}
          {top.map((t, i) => (
            <span key={t.label}>
              {i > 0 && " · "}
              <span className="text-foreground">{t.label}</span>{" "}
              <span className="tabular-nums">{t.share}%</span>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
