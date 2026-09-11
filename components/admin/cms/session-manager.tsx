"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { FilterChips } from "@/components/admin/ui/filter-chips";
import { saveSession, deleteSession } from "@/lib/admin/cms-actions";
import { formatDateTime } from "@/lib/format";
import { EVENT_DAYS } from "@/lib/event";
import { VENUE_OPTIONS, roomSlugFromLegacy, venueLabel } from "@/lib/locations";
import { activationOptions } from "@/lib/schedule";
import { slugify } from "@/lib/slug";
import { TRACKS } from "@/lib/tracks";
import type {
  SessionRow,
  SpeakerRow,
  SessionParticipant,
  ParticipantRole,
} from "@/lib/admin/cms-types";

/**
 * The week's timezone, and the reason this file does its own date maths.
 *
 * Sessions used to be entered with two <input type="datetime-local">, which
 * submits a bare "2026-09-29T14:00" — no offset. `z.coerce.date()` hands that
 * to `new Date()`, and a date-time with no offset is parsed *in the runtime's
 * timezone*. Vercel runs UTC. So an organiser typing 2:00 PM stored 14:00Z,
 * and every public surface — which all render in America/Chicago — showed it
 * as 9:00 AM. It went unnoticed because locally the dev server runs in the
 * machine's own timezone, where the same input round-trips correctly.
 *
 * The GDG session was entered that way and was live on the site reading five
 * hours early. Re-saving a row through this form corrects it.
 *
 * Everything below therefore works in explicit Chicago wall-clock time and
 * submits an explicit offset, so nothing depends on where the server or the
 * browser happens to be.
 */
const TZ = "America/Chicago";

/**
 * -05:00 for the whole week, and safe to hardcode: the event is Sept 28 – Oct
 * 2 2026 and US DST does not end until Nov 1, so every session is CDT. A week
 * that ever straddles the change needs a real zoned conversion here, not a
 * different constant.
 */
const OFFSET = "-05:00";

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** An instant, as the day and wall-clock time it lands on in San Antonio. */
function toParts(ms: number | null): { day: string; time: string } {
  if (!ms) return { day: "", time: "" };
  const got: Record<string, string> = {};
  for (const part of PARTS.formatToParts(new Date(ms))) {
    got[part.type] = part.value;
  }
  // `hour12: false` yields "24" for midnight in some engines rather than "00".
  const hour = got.hour === "24" ? "00" : got.hour;
  return {
    day: `${got.year}-${got.month}-${got.day}`,
    time: `${hour}:${got.minute}`,
  };
}

const LABEL = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  month: "short",
  day: "numeric",
});

const DAY_OPTIONS = EVENT_DAYS.map((d) => ({
  value: d.iso,
  // Parsed at noon UTC so the label cannot land on the previous day when it is
  // rendered back in Chicago.
  label: LABEL.format(new Date(`${d.iso}T12:00:00Z`)),
}));

/**
 * Every quarter hour from 7am to 10pm.
 *
 * The week's real span is the 7:30 brunch to the 8pm bash, so this covers it
 * with room either side. Quarter hours because nothing on this schedule starts
 * at 2:07, and a list of 61 is one the Combobox gives a search box to.
 */
const TIME_OPTIONS = Array.from({ length: 61 }, (_, i) => {
  const mins = 7 * 60 + i * 15;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const value = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    value,
    label: `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`,
  };
});

/**
 * The grid, plus whatever a row already holds.
 *
 * A stored time off the quarter-hour — or outside 7am–10pm — would otherwise
 * match no option, the picker would show its placeholder, and saving an
 * untouched row would silently move the session. The venue picker deliberately
 * blanks on an unmatched legacy value because a human should re-choose it;
 * a time is not ambiguous, it is just unusual, so it is kept.
 */
function timeOptions(current: string) {
  if (!current || TIME_OPTIONS.some((o) => o.value === current)) {
    return TIME_OPTIONS;
  }
  const [h, m] = current.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const label = `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  return [{ value: current, label }, ...TIME_OPTIONS];
}

export function SessionManager({
  rows,
  speakers,
}: {
  rows: SessionRow[];
  speakers: SpeakerRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<SessionRow | "new" | null>(null);
  const [participants, setParticipants] = React.useState<SessionParticipant[]>(
    [],
  );
  // Controlled so the URL preview below the field can follow it as you type,
  // the way the speakers' drawer follows a name.
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [track, setTrack] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [activation, setActivation] = React.useState("");
  /** Which day the rail is showing; "all" is the whole week. */
  const [railDay, setRailDay] = React.useState<string>("all");
  const [day, setDay] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [pickerValue, setPickerValue] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<
    Record<string, string[] | undefined>
  >({});

  const speakerName = React.useCallback(
    (id: string) => speakers.find((s) => s.id === id)?.name ?? "Unknown",
    [speakers],
  );

  function open(row: SessionRow | "new") {
    setError(null);
    setIssues({});
    setParticipants(
      row === "new"
        ? []
        : row.participants.map((p) => ({
            speakerId: p.speakerId,
            role: p.role,
          })),
    );
    setTitle(row === "new" ? "" : row.title);
    // Pre-filled with the stored slug, which is what keeps a retitle from
    // moving a published URL: the field carries the old slug forward unless
    // someone edits it on purpose.
    setSlug(row === "new" ? "" : row.slug);
    setTrack(row === "new" ? "" : (row.track ?? ""));
    // Legacy rows hold a free-text location. Match it back to a slug where
    // possible so an edit doesn't silently blank a field the admin never
    // touched; leave it empty where it can't be matched, so the ambiguous
    // ones get chosen rather than guessed.
    setVenue(row === "new" ? "" : (roomSlugFromLegacy(row.location) ?? ""));
    setActivation(row === "new" ? "" : (row.activation ?? ""));
    const start = toParts(row === "new" ? null : row.startsAt);
    const end = toParts(row === "new" ? null : (row.endsAt ?? null));
    // A session's day comes off its start. An end is a time only — nothing on
    // this schedule runs past midnight, and offering a second day picker for a
    // case that does not exist is a field to get wrong.
    setDay(start.day);
    setStartTime(start.time);
    setEndTime(end.time);
    setPickerValue("");
    setEditing(row);
  }

  function addParticipant(speakerId: string) {
    if (!speakerId) return;
    setParticipants((prev) =>
      prev.some((p) => p.speakerId === speakerId)
        ? prev
        : [...prev, { speakerId, role: "speaker" }],
    );
    setPickerValue("");
  }

  function setRole(speakerId: string, role: ParticipantRole) {
    setParticipants((prev) =>
      prev.map((p) => (p.speakerId === speakerId ? { ...p, role } : p)),
    );
  }

  function removeParticipant(speakerId: string) {
    setParticipants((prev) => prev.filter((p) => p.speakerId !== speakerId));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIssues({});
    const form = new FormData(e.currentTarget);
    form.set("participants", JSON.stringify(participants));
    form.set("slug", slug.trim());
    form.set("track", track);
    form.set("location", venue);
    form.set("activation", activation);
    // Explicit offset, which is the whole point of this picker: an ISO string
    // carrying -05:00 means the same instant whether it is parsed on a UTC
    // server, a Chicago laptop or anywhere else.
    form.set(
      "startsAt",
      day && startTime ? `${day}T${startTime}:00${OFFSET}` : "",
    );
    form.set("endsAt", day && endTime ? `${day}T${endTime}:00${OFFSET}` : "");
    startTransition(async () => {
      const res = await saveSession(form);
      if (!res.ok) {
        setError(res.error);
        setIssues(res.issues ?? {});
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete(row: SessionRow) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    startTransition(async () => {
      await deleteSession(row.id);
      setEditing(null);
      router.refresh();
    });
  }

  /**
   * The week down the rail, the activations inside each day.
   *
   * Two axes, because the schedule has two. Roughly fifty sessions are coming:
   * twenty on the main stage spread across the five days, and the rest inside
   * nine activations that each sit on one day — The Model owns the Monday,
   * Access Granted the Wednesday, PySanAntonio the Friday. One flat list of
   * fifty is ten thousand pixels of scroll, and either axis alone leaves a
   * pile: by day you still get thirteen undifferentiated rows on the Monday,
   * by activation the main stage is one bucket of twenty.
   *
   * So the day narrows the set and the activation groups what is left, which
   * is also the order the team works in — a day gets programmed, and an
   * activation's running order gets filled.
   */
  const dayOf = React.useCallback(
    (row: SessionRow) => toParts(row.startsAt).day,
    [],
  );

  const dayCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[dayOf(r)] = (c[dayOf(r)] ?? 0) + 1;
    return c;
  }, [rows, dayOf]);

  const visible = React.useMemo(
    () => (railDay === "all" ? rows : rows.filter((r) => dayOf(r) === railDay)),
    [rows, railDay, dayOf],
  );

  /** Activation slug to its display title, for the group headings. */
  const activationTitle = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const a of activationOptions()) m.set(a.slug, a.title);
    return m;
  }, []);

  /**
   * Standalone first, then activations in the order their first session runs.
   *
   * Sorting the groups by time rather than by name keeps the page reading as a
   * day: the main stage leads because it is the spine of the schedule, and the
   * activations follow in the order somebody walking the week would meet them.
   */
  const groups = React.useMemo(() => {
    const by = new Map<string, SessionRow[]>();
    for (const r of visible) {
      const k = r.activation ?? "";
      const list = by.get(k) ?? [];
      list.push(r);
      by.set(k, list);
    }
    return [...by.entries()]
      .map(([slug, list]) => ({
        slug,
        label: slug ? (activationTitle.get(slug) ?? slug) : "Main stage",
        list,
        first: Math.min(...list.map((r) => r.startsAt)),
      }))
      .sort((a, b) =>
        a.slug === "" ? -1 : b.slug === "" ? 1 : a.first - b.first,
      );
  }, [visible, activationTitle]);

  const current = editing === "new" ? null : editing;
  const available = speakers.filter(
    (s) => !participants.some((p) => p.speakerId === s.id),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        {speakers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add speakers first to assign them to sessions.
          </p>
        )}
        {/* The week down the rail. Counts on the chips so an empty day is
            visible without opening it — which is the question being asked
            while a schedule is still being built. */}
        <FilterChips
          value={railDay}
          onChange={setRailDay}
          options={[
            { key: "all", label: "All", count: rows.length },
            ...EVENT_DAYS.map((d) => ({
              key: d.iso,
              label: d.label,
              count: dayCounts[d.iso] ?? 0,
            })),
          ]}
        />
        <Button className="ml-auto" onClick={() => open("new")}>
          Add session
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {rows.length === 0
            ? "No sessions yet. Build the schedule."
            : "Nothing on this day yet."}
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((group) => (
            <div
              key={group.slug || "standalone"}
              className="flex flex-col gap-3"
            >
              {/* The activation is a heading rather than a field on every card:
                  a running order is a list under its own name, and repeating
                  "Datanauts" on nine rows says it nine times. */}
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide">
                  {group.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {group.list.length}
                </span>
              </div>
              {group.list.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold">
                          {row.title}
                        </span>
                        {row.track && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {row.track}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(row.startsAt)}
                        {row.endsAt
                          ? ` – ${formatDateTime(row.endsAt)}`
                          : ""} · {venueLabel(row.location)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => open(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {row.description}
                  </p>
                  {row.participants.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {row.participants.map((p) => (
                        <Badge
                          key={p.speakerId}
                          tone={p.role === "moderator" ? "magenta" : "blue"}
                        >
                          {p.name}
                          {p.role === "moderator" ? " · mod" : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? "Edit session" : "Add session"}
      >
        {editing !== null && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            {current && <input type="hidden" name="id" value={current.id} />}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {issues.title?.[0] && <FieldError>{issues.title[0]}</FieldError>}
            </div>

            <SlugField
              title={title}
              slug={slug}
              setSlug={setSlug}
              // Only a session that stands on its own has a page of its own.
              // One inside an activation is shown on that activation's page,
              // so its slug is stored and unused — say so rather than print a
              // URL that goes nowhere.
              standalone={activation === ""}
              currentSlug={current?.slug ?? null}
              issue={issues.slug?.[0]}
            />

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={current?.description}
                required
              />
              {issues.description?.[0] && (
                <FieldError>{issues.description[0]}</FieldError>
              )}
            </div>

            {/* Day, then start, then end — three short lists instead of two
                free-text datetimes.
            
                The old pair asked for a full date every time, on an event
                whose every session falls on one of five known days, and asked
                for it in the browser's timezone while the site renders in San
                Antonio's. This cannot express a date outside the week, cannot
                express a time nobody would schedule, and cannot mean two
                different instants on two different machines. */}
            <div>
              <Label>Day</Label>
              <Combobox
                value={day}
                onChange={setDay}
                placeholder="Pick a day"
                options={DAY_OPTIONS}
              />
              {issues.startsAt?.[0] && (
                <FieldError>{issues.startsAt[0]}</FieldError>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Starts</Label>
                <Combobox
                  value={startTime}
                  onChange={(v) => {
                    setStartTime(v);
                    // An end that now sits before the start is worse than no
                    // end: it renders as a negative slot on the activation
                    // page. Clearing it makes the admin re-pick rather than
                    // silently shipping it.
                    if (endTime && v && endTime <= v) setEndTime("");
                  }}
                  placeholder="Start time"
                  options={timeOptions(startTime)}
                />
              </div>
              <div>
                <Label>Ends (optional)</Label>
                <Combobox
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="End time"
                  // Only times after the start, so the pair cannot be inverted
                  // in the first place. Before a start is chosen the whole
                  // grid is offered rather than nothing, so the two can be
                  // filled in either order.
                  options={timeOptions(endTime).filter(
                    (o) => !startTime || o.value > startTime,
                  )}
                />
              </div>
            </div>
            <p className="-mt-2 font-mono text-[11px] uppercase tracking-widest text-white/40">
              All times San Antonio (CDT)
            </p>

            <div>
              <Label>Venue</Label>
              {/* One of the six rooms, stored as a slug. Free text let "The
                  Rand", "the rand" and "Geekdom 3rd floor" all coexist, so
                  sessions could not be grouped by venue or linked to a venue
                  page. Rows saved before this show an empty picker when their
                  old value can't be matched — that's deliberate, it makes the
                  ambiguous ones get chosen rather than guessed. */}
              <Combobox
                value={venue}
                onChange={setVenue}
                placeholder="Pick a venue"
                options={VENUE_OPTIONS.map((v) => ({
                  value: v.slug,
                  label: v.name,
                }))}
              />
              {issues.location?.[0] && (
                <FieldError>{issues.location[0]}</FieldError>
              )}
            </div>

            <div>
              <Label>Part of</Label>
              {/* Optional. Set it and the session shows on that activation's
                  page; leave it and the session stands on its own in the
                  week. */}
              <Combobox
                value={activation}
                onChange={setActivation}
                placeholder="Stands on its own"
                options={[
                  { value: "", label: "Stands on its own" },
                  ...activationOptions().map((a) => ({
                    value: a.slug,
                    label: a.title,
                  })),
                ]}
              />
              {issues.activation?.[0] && (
                <FieldError>{issues.activation[0]}</FieldError>
              )}
            </div>

            <div>
              <Label>Track</Label>
              <Combobox
                value={track}
                onChange={setTrack}
                placeholder="No track"
                options={[
                  { value: "", label: "No track" },
                  ...TRACKS.map((t) => ({ value: t.name, label: t.name })),
                ]}
              />
            </div>

            <div>
              <Label>Speakers &amp; moderators</Label>
              <Combobox
                options={available.map((s) => ({ value: s.id, label: s.name }))}
                value={pickerValue}
                onChange={addParticipant}
                placeholder={
                  available.length ? "Add a speaker…" : "All speakers added"
                }
                searchPlaceholder="Search speakers…"
                disabled={available.length === 0}
              />

              {participants.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {participants.map((p) => (
                    <div
                      key={p.speakerId}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm font-medium">
                        {speakerName(p.speakerId)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Combobox
                          value={p.role}
                          onChange={(v) =>
                            setRole(p.speakerId, v as ParticipantRole)
                          }
                          options={[
                            { value: "speaker", label: "Speaker" },
                            { value: "moderator", label: "Moderator" },
                          ]}
                          size="sm"
                          className="w-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.speakerId)}
                          className="text-xs text-muted-foreground hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}

function SlugField({
  title,
  slug,
  setSlug,
  standalone,
  currentSlug,
  issue,
}: {
  title: string;
  slug: string;
  setSlug: (v: string) => void;
  standalone: boolean;
  currentSlug: string | null;
  issue?: string;
}) {
  // Mirrors what the action will land on, minus the collision suffix — it
  // can't know what's taken without a round trip, and a "-2" surprise on save
  // is rare enough to explain there rather than predict here.
  const preview = slugify(slug.trim() || title, "session");
  const moving =
    standalone && currentSlug && slug.trim() && preview !== currentSlug;

  return (
    <div>
      <Label htmlFor="slug">Public URL</Label>
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          /schedule/talk/
        </span>
        <Input
          id="slug"
          name="slug"
          value={slug}
          placeholder={slugify(title || "title", "session")}
          onChange={(e) => setSlug(e.target.value)}
          className="font-mono"
        />
      </div>
      {standalone ? (
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
          {preview
            ? `sasw.co/schedule/talk/${preview}`
            : "sasw.co/schedule/talk/\u2026"}
        </p>
      ) : (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          This session runs inside an activation, so it shows on that
          activation&rsquo;s page rather than one of its own. Saved either way,
          for if it is ever detached.
        </p>
      )}
      {issue && <FieldError>{issue}</FieldError>}
      {moving && (
        <p className="mt-1 text-xs text-amber-600">
          Changing this moves the page. {currentSlug} will redirect here.
        </p>
      )}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
