"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkIn, undoCheckIn } from "@/lib/admin/actions";
import { formatDateTime } from "@/lib/format";
import { EVENT_DAYS, localDayKey } from "@/lib/event";
import { cn } from "@/lib/utils";
import type { RegistrationRow } from "@/lib/admin/types";

export function CheckinPortal({
  rows,
  initialQuery = "",
}: {
  rows: RegistrationRow[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(rows);
  const [query, setQuery] = React.useState(initialQuery);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setItems(rows), [rows]);

  const checkedInCount = React.useMemo(
    () => items.filter((r) => r.checkedIn).length,
    [items],
  );
  const pct = items.length
    ? Math.round((checkedInCount / items.length) * 100)
    : 0;

  // Arrivals per event day — each checked-in person falls on the day they checked in.
  const byDay = React.useMemo(() => {
    const counts = new Map(EVENT_DAYS.map((d) => [d.iso, 0]));
    for (const r of items) {
      if (!r.checkedIn || !r.checkedInAt) continue;
      const key = localDayKey(r.checkedInAt);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return EVENT_DAYS.map((d) => ({ ...d, count: counts.get(d.iso) ?? 0 }));
  }, [items]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((r) =>
        [r.name, r.email, r.company]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
      .slice(0, 25);
  }, [items, query]);

  const recent = React.useMemo(
    () =>
      items
        .filter((r) => r.checkedIn)
        .sort((a, b) => (b.checkedInAt ?? 0) - (a.checkedInAt ?? 0))
        .slice(0, 8),
    [items],
  );

  function doCheckIn(row: RegistrationRow) {
    setBusy(row.id);
    const prev = items;
    setItems((list) =>
      list.map((r) =>
        r.id === row.id
          ? { ...r, checkedIn: true, checkedInAt: Date.now(), checkedInBy: "you" }
          : r,
      ),
    );
    startTransition(async () => {
      const res = await checkIn(row.id);
      if (!res.ok) setItems(prev);
      setBusy(null);
      router.refresh();
    });
  }

  function doUndo(row: RegistrationRow) {
    setBusy(row.id);
    const prev = items;
    setItems((list) =>
      list.map((r) =>
        r.id === row.id
          ? { ...r, checkedIn: false, checkedInAt: null, checkedInBy: null }
          : r,
      ),
    );
    startTransition(async () => {
      const res = await undoCheckIn(row.id);
      if (!res.ok) setItems(prev);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search — the action, front and center */}
      <Input
        autoFocus
        placeholder="Search a name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-14 text-lg"
      />

      {/* Running count — one glanceable line */}
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-sm">
          <span className="font-display text-lg font-bold tabular-nums text-magenta">
            {checkedInCount}
          </span>
          <span className="text-muted-foreground">
            {" "}
            of {items.length} checked in
          </span>
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-magenta transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
          {pct}%
        </span>
      </div>

      {query.trim() ? (
        <div className="flex flex-col gap-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No match. Check the spelling, or try their email.
            </p>
          ) : (
            results.map((r) => (
              <Row
                key={r.id}
                row={r}
                busy={busy === r.id && pending}
                onCheckIn={() => doCheckIn(r)}
                onUndo={() => doUndo(r)}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Recent check-ins
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-muted-foreground">
              Nobody&apos;s plugged in yet. Search above to check the first person in.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((r) => (
                <Row
                  key={r.id}
                  row={r}
                  busy={busy === r.id && pending}
                  onCheckIn={() => doCheckIn(r)}
                  onUndo={() => doUndo(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Check-ins by day — secondary reference, out of the way */}
      <div className="mt-2 border-t border-border pt-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Check-ins by day
        </div>
        <div className="grid grid-cols-5 gap-2">
          {byDay.map((d) => {
            const isToday = d.iso === localDayKey(Date.now());
            return (
              <div
                key={d.iso}
                className={cn(
                  "rounded-lg border bg-white p-2.5 text-center",
                  isToday ? "border-magenta" : "border-border",
                )}
              >
                <div className="font-display text-lg font-bold tabular-nums">
                  {d.count}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({
  row,
  busy,
  onCheckIn,
  onUndo,
}: {
  row: RegistrationRow;
  busy: boolean;
  onCheckIn: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.name}</span>
          {row.checkedIn && <Badge tone="success">In</Badge>}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {row.email}
          {row.company ? ` · ${row.company}` : ""}
          {row.checkedIn && row.checkedInAt
            ? ` · ${formatDateTime(row.checkedInAt)}`
            : ""}
        </div>
      </div>
      {row.checkedIn ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={onUndo}
          className="shrink-0"
        >
          Undo
        </Button>
      ) : (
        <Button
          size="md"
          disabled={busy}
          onClick={onCheckIn}
          className="shrink-0"
        >
          {busy ? "…" : "Check in"}
        </Button>
      )}
    </div>
  );
}

