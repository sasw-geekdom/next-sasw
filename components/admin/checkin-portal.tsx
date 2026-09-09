"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { checkIn, registerAtDoor, undoCheckIn } from "@/lib/admin/actions";
import { formatDateTime } from "@/lib/format";
import { EVENT_DAYS, localDayKey } from "@/lib/event";
import {
  newClientId,
  useCheckinQueue,
  type QueuedOp,
} from "@/lib/admin/checkin-queue";
import { cn } from "@/lib/utils";
import {
  ATTENDEE_TYPES,
  type AttendeeType,
  type RegistrationRow,
} from "@/lib/admin/types";

/**
 * The door.
 *
 * Deliberately not on the admin control scale the other pages moved to. Those
 * are read sitting down on a laptop; this one is held at arm's length in a
 * doorway, often by a volunteer, one-handed, with somebody waiting. The 56px
 * search field and the full-size Check in button are the point of the page, so
 * they stay.
 *
 * What it does borrow is the sticky pattern: the search box and the running
 * count pin to the top, because scrolling a list of matches used to push the
 * field you are typing into off the screen.
 */
export function CheckinPortal({
  rows,
  speakers = [],
  initialQuery = "",
}: {
  rows: RegistrationRow[];
  /** The speaker roster, so an invited speaker is findable at the door. */
  speakers?: { id: string; name: string }[];
  initialQuery?: string;
}) {
  const [items, setItems] = React.useState(rows);
  const [query, setQuery] = React.useState(initialQuery);
  // Read once, at mount. `Date.now()` in the body is impure — it made every
  // re-render re-derive which card is today. The clock is the browser's rather
  // than the server's on purpose: the server runs in UTC, so after 7pm Central
  // it would already be highlighting tomorrow.
  const [today] = React.useState(() => localDayKey(Date.now()));

  /**
   * The days a person has attended.
   *
   * Rows written before per-day check-in existed have an empty array and a
   * single `checkedInAt`, which is the day they came — so it stands in, and the
   * old records keep counting on the right day instead of vanishing.
   */
  const daysOf = React.useCallback((r: RegistrationRow): string[] => {
    if (r.checkedInDays.length > 0) return r.checkedInDays;
    return r.checkedIn && r.checkedInAt ? [localDayKey(r.checkedInAt)] : [];
  }, []);

  const { queue, online, run, retry } = useCheckinQueue(
    React.useCallback(async (op: QueuedOp) => {
      if (op.kind === "checkIn") return checkIn(op.id, op.day);
      if (op.kind === "undo") return undoCheckIn(op.id, op.day);
      return registerAtDoor({
        name: op.name,
        email: op.email,
        attendeeType: op.attendeeType,
        day: op.day,
        clientId: op.clientId,
      });
    }, []),
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  /** The name being added at the door, once someone opens the walk-in form. */
  const [walkIn, setWalkIn] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  /**
   * The last person through, held for a few seconds.
   *
   * The old feedback was a badge appearing on the row and the button turning
   * into Undo — accurate, and far too quiet for someone glancing down in a
   * doorway mid-conversation. `id` is null for a walk-in, which has no undo to
   * offer: taking the check-in back would leave a registration behind that
   * nobody meant to create.
   */
  const [confirmed, setConfirmed] = React.useState<{
    name: string;
    id: string | null;
  } | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const confirmTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Clear the field, put the cursor back, and say who just went through. */
  const advance = React.useCallback((name: string, id: string | null) => {
    setQuery("");
    setConfirmed({ name, id });
    searchRef.current?.focus();
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmed(null), 6000);
  }, []);

  React.useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );
  const [pending, startTransition] = React.useTransition();

  // Render-phase derived state, not an effect. As an effect this also fought
  // the optimistic updates below: a refresh landing mid-transition replaced
  // `items` wholesale, so a row someone had just tapped could snap back to
  // "Check in" for as long as the server took to answer.
  const [prevRows, setPrevRows] = React.useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    setItems(rows);
  }

  /** Today's number is the door's number; the week's total sits beside it. */
  const inToday = React.useMemo(
    () => items.filter((r) => daysOf(r).includes(today)).length,
    [items, daysOf, today],
  );
  const inAnyDay = React.useMemo(
    () => items.filter((r) => daysOf(r).length > 0).length,
    [items, daysOf],
  );
  const pct = items.length ? Math.round((inToday / items.length) * 100) : 0;

  // Arrivals per event day — a person now counts on every day they came, not
  // only the first.
  const byDay = React.useMemo(() => {
    const counts = new Map(EVENT_DAYS.map((d) => [d.iso, 0]));
    for (const r of items) {
      for (const key of daysOf(r)) {
        if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return EVENT_DAYS.map((d) => ({ ...d, count: counts.get(d.iso) ?? 0 }));
  }, [items, daysOf]);

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

  /**
   * Speakers with no registration of their own.
   *
   * Matched by name because the speaker records carry no email. A speaker who
   * did fill in the public form is already a row above and is dropped here, so
   * the door never offers the same person twice.
   */
  const speakerHits = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const registered = new Set(items.map((r) => r.name.trim().toLowerCase()));
    return speakers
      .filter(
        (sp) =>
          sp.name.toLowerCase().includes(q) &&
          !registered.has(sp.name.trim().toLowerCase()),
      )
      .slice(0, 5);
  }, [speakers, items, query]);

  const recent = React.useMemo(
    () =>
      items
        .filter((r) => daysOf(r).includes(today))
        .sort((a, b) => (b.checkedInAt ?? 0) - (a.checkedInAt ?? 0))
        .slice(0, 8),
    [items, daysOf, today],
  );

  /** Apply a day change to a row in local state. */
  function patchDay(id: string, day: string, add: boolean) {
    setItems((list) =>
      list.map((r) => {
        if (r.id !== id) return r;
        const base = daysOf(r);
        const days = add
          ? Array.from(new Set([...base, day]))
          : base.filter((d) => d !== day);
        return {
          ...r,
          checkedInDays: days,
          checkedIn: days.length > 0,
          checkedInAt: add ? Date.now() : days.length ? r.checkedInAt : null,
          checkedInBy: days.length ? (r.checkedInBy ?? "you") : null,
        };
      }),
    );
  }

  function doCheckIn(row: RegistrationRow) {
    setBusy(row.id);
    patchDay(row.id, today, true); // optimistic
    advance(row.name, row.id);
    startTransition(async () => {
      const res = await run({
        kind: "checkIn",
        clientId: newClientId(),
        id: row.id,
        day: today,
        name: row.name,
      });
      // A queued op keeps the optimistic state — it is going to land, and the
      // door has a banner saying so. Only a real refusal is rolled back.
      if (!res.ok && !res.queued) {
        patchDay(row.id, today, false);
        setConfirmed(null);
        if (res.error) setError(res.error);
      }
      setBusy(null);
    });
  }

  function doUndo(row: RegistrationRow) {
    setBusy(row.id);
    patchDay(row.id, today, false);
    startTransition(async () => {
      const res = await run({
        kind: "undo",
        clientId: newClientId(),
        id: row.id,
        day: today,
        name: row.name,
      });
      if (!res.ok && !res.queued) {
        patchDay(row.id, today, true);
        if (res.error) setError(res.error);
      }
      setBusy(null);
    });
  }

  /** Add somebody who is not on the list, and let them in. */
  function doWalkIn(name: string, type: AttendeeType, email = "") {
    const key = `walkin:${name}`;
    const clientId = newClientId();
    setBusy(key);
    // Straight into the list the search reads, with the client id as its
    // temporary key, so the row appears checked in without a round trip — and
    // so a queued walk-in is visible on the door while it waits.
    setItems((list) => [
      {
        id: clientId,
        name,
        email,
        circuits: [],
        volunteerDays: [],
        sponsorConsent: false,
        checkedIn: true,
        checkedInDays: [today],
        checkedInAt: Date.now(),
        checkedInBy: "you",
        createdAt: Date.now(),
        source: "door",
        attendeeType: type,
      },
      ...list,
    ]);
    setWalkIn(null);
    advance(name, null);
    startTransition(async () => {
      const res = await run({
        kind: "walkIn",
        clientId,
        day: today,
        name,
        email,
        attendeeType: type,
      });
      if (!res.ok && !res.queued) {
        setItems((list) => list.filter((r) => r.id !== clientId));
        setConfirmed(null);
        if (res.error) setError(res.error);
      }
      setBusy(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Pinned, and nothing else is. The running count and the day grid used
          to sit here too, between the field and the results — organiser
          numbers occupying the one part of the screen the door actually works
          in. On a phone with the keyboard up there is about 270px to see
          matches in, and that strip was taking a third of it for a figure
          nobody at the door acts on. They are at the foot of the page now. */}
      <div className="sticky -top-5 z-20 -mx-4 bg-background px-4 pb-3 pt-5 sm:-top-6 sm:-mx-6 sm:px-6 sm:pt-6">
        <Input
          ref={searchRef}
          autoFocus
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search a name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 text-lg"
        />
      </div>

      {/* Who just went through. Loud on purpose, and it clears itself, so the
          door does not have to dismiss anything between people. */}
      {confirmed && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 rounded-lg bg-foreground px-4 py-3.5 text-white"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Check className="h-5 w-5 shrink-0" strokeWidth={3} />
            <span className="truncate font-display text-lg font-bold uppercase">
              {confirmed.name}
            </span>
          </div>
          {confirmed.id ? (
            <button
              type="button"
              onClick={() => {
                const row = items.find((r) => r.id === confirmed.id);
                if (row) doUndo(row);
                setConfirmed(null);
              }}
              className="shrink-0 text-sm underline underline-offset-4"
            >
              Undo
            </button>
          ) : (
            <span className="shrink-0 text-sm text-white/60">Added</span>
          )}
        </div>
      )}

      {(!online || queue.length > 0) && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
        >
          <span>
            {queue.length > 0 ? (
              <>
                <span className="font-medium tabular-nums">{queue.length}</span>{" "}
                waiting to save. They are recorded here and will go up on their
                own.
              </>
            ) : (
              "Offline. Check-ins are being saved on this device."
            )}
          </span>
          <button
            type="button"
            onClick={() => void retry()}
            className="shrink-0 underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-magenta/10 px-4 py-3 text-sm">
          {error}{" "}
          <button
            type="button"
            onClick={() => setError(null)}
            className="underline underline-offset-4"
          >
            Dismiss
          </button>
        </p>
      )}

      {query.trim() ? (
        <div className="flex flex-col gap-2">
          {results.map((r) => (
            <Row
              key={r.id}
              row={r}
              days={daysOf(r)}
              today={today}
              busy={busy === r.id && pending}
              onCheckIn={() => doCheckIn(r)}
              onUndo={() => doUndo(r)}
            />
          ))}

          {/* Invited speakers who never registered. Checking one in writes
              them a door record, so they count like everybody else. */}
          {speakerHits.map((sp) => (
            <div
              key={sp.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{sp.name}</span>
                  <Badge tone="blue">Speaker</Badge>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  On the speaker roster · not registered
                </div>
              </div>
              <Button
                size="md"
                disabled={busy === `walkin:${sp.name}` && pending}
                onClick={() => doWalkIn(sp.name, "speaker")}
                className="shrink-0"
              >
                {busy === `walkin:${sp.name}` && pending ? "…" : "Check in"}
              </Button>
            </div>
          ))}

          {/* Nobody on either list. At a free community event that is a normal
              outcome, not an error, so the door gets a way through it rather
              than a dead end. */}
          {results.length === 0 && speakerHits.length === 0 && (
            <WalkInCard
              name={query.trim()}
              open={walkIn === query.trim()}
              busy={busy === `walkin:${query.trim()}` && pending}
              onOpen={() => setWalkIn(query.trim())}
              onCancel={() => setWalkIn(null)}
              onAdd={doWalkIn}
            />
          )}
        </div>
      ) : (
        <div>
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Recent check-ins
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-muted-foreground">
              Nobody&apos;s plugged in yet. Search above to check the first
              person in.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((r) => (
                <Row
                  key={r.id}
                  row={r}
                  days={daysOf(r)}
                  today={today}
                  busy={busy === r.id && pending}
                  onCheckIn={() => doCheckIn(r)}
                  onUndo={() => doUndo(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* The organiser's view of the door, kept at the foot of it. */}
      <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-center gap-3">
          <span className="whitespace-nowrap text-sm">
            <span className="font-display text-lg font-bold tabular-nums text-magenta">
              {inToday}
            </span>
            {/* Today, because that is what the door is producing. The week's
                unique attendance follows it — on the Thursday "180 in" and
                "62 in today" are different questions, and the cumulative one
                used to be the only one on screen. */}
            <span className="text-muted-foreground">
              {" "}
              in today · {inAnyDay} of {items.length} this week
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

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {byDay.map((d) => {
            const isToday = d.iso === today;
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
  days,
  today,
  busy,
  onCheckIn,
  onUndo,
}: {
  row: RegistrationRow;
  days: string[];
  today: string;
  busy: boolean;
  onCheckIn: () => void;
  onUndo: () => void;
}) {
  const inToday = days.includes(today);
  // Days other than today, so a returning attendee reads as returning rather
  // than as somebody who has not arrived. This is the case the old boolean
  // could not express at all: they were "in" from Monday onwards and the
  // button to let them in on Thursday was never offered.
  const otherDays = EVENT_DAYS.filter(
    (d) => d.iso !== today && days.includes(d.iso),
  );

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.name}</span>
          {inToday && <Badge tone="success">In today</Badge>}
          {row.attendeeType && row.attendeeType !== "attendee" && (
            <Badge tone="blue">{row.attendeeType}</Badge>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {row.email}
          {row.company ? ` · ${row.company}` : ""}
          {inToday && row.checkedInAt
            ? ` · ${formatDateTime(row.checkedInAt)}`
            : ""}
        </div>
        {otherDays.length > 0 && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            Also came {otherDays.map((d) => d.label).join(", ")}
          </div>
        )}
      </div>
      {inToday ? (
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

/**
 * The way out of "no match".
 *
 * Two taps for the common case: open it, pick what they are, done. The name is
 * already filled in from what was typed into the search, and email is optional
 * — somebody in a queue who does not want to give one still gets in, and a
 * blank email simply means the duplicate guard has nothing to match on.
 */
function WalkInCard({
  name,
  open,
  busy,
  onOpen,
  onCancel,
  onAdd,
}: {
  name: string;
  open: boolean;
  busy: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onAdd: (name: string, type: AttendeeType, email: string) => void;
}) {
  const [type, setType] = React.useState<AttendeeType>("attendee");
  const [email, setEmail] = React.useState("");

  if (!open) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
        <p className="text-muted-foreground">
          No match for “{name}”. Check the spelling, or add them at the door.
        </p>
        <Button size="md" onClick={onOpen} className="mt-3">
          Add {name}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4">
      <div>
        <div className="font-display text-lg font-bold">{name}</div>
        <p className="text-xs text-muted-foreground">
          Added at the door and checked in straight away.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ATTENDEE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={t === type}
            className={cn(
              "h-11 rounded-md border px-3 text-sm font-medium capitalize transition-colors",
              t === type
                ? "border-foreground bg-foreground text-white"
                : "border-border bg-white text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Input
        type="email"
        inputMode="email"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12"
      />

      <div className="flex gap-2">
        <Button
          size="md"
          disabled={busy}
          onClick={() => onAdd(name, type, email)}
          className="flex-1"
        >
          {busy ? "…" : "Add and check in"}
        </Button>
        <Button variant="ghost" size="md" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
