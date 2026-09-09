"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { AdminInput } from "@/components/admin/ui/controls";
import { FilterChips } from "@/components/admin/ui/filter-chips";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  updateSubmissionStatus,
  promoteToSpeaker,
  deleteSpeakerSubmission,
} from "@/lib/admin/actions";
import { formatDate, formatDateTime } from "@/lib/format";
import { TRACK_NAMES } from "@/lib/tracks";
import {
  applySpeakerFilters,
  isSpeakerFiltered,
  parseSpeakerFilters,
  speakerSearchParams,
  stageCounts,
  type SpeakerFilters,
  type SpeakerStage,
} from "@/lib/admin/speaker-filters";
import {
  SUBMISSION_STATUSES,
  type SpeakerSubmissionRow,
  type SubmissionStatus,
} from "@/lib/admin/types";

/**
 * The header cell, pinned. The offset matches `<main>`'s padding — sticky pins
 * to the scroll container's content box, so without it the first row shows a
 * sliver above the header.
 */
const TH =
  "sticky -top-5 z-10 bg-muted px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)] sm:-top-6";

export function SpeakersTable({ rows }: { rows: SpeakerSubmissionRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [items, setItems] = React.useState(rows);
  const [filters, setFilters] = React.useState<SpeakerFilters>(() =>
    parseSpeakerFilters(params),
  );
  const [selected, setSelected] = React.useState<SpeakerSubmissionRow | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();
  /** A status saved but its decision email did not send — see the action. */
  const [notice, setNotice] = React.useState<string | null>(null);

  // Sync when the server sends fresh rows (after revalidate) — render-phase
  // derived state, not an effect, which is what the other two admin tables do
  // and what `react-hooks/set-state-in-effect` was objecting to here.
  const [prevRows, setPrevRows] = React.useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    setItems(rows);
  }

  /** Filters go to the URL with `replaceState` — see the registrations table. */
  function update(patch: Partial<SpeakerFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const qs = speakerSearchParams(next).toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }

  const filtered = React.useMemo(
    () => applySpeakerFilters(items, filters),
    [items, filters],
  );

  const counts = React.useMemo(() => stageCounts(items), [items]);
  const qs = speakerSearchParams(filters).toString();

  // Export exactly what's shown — respects search + track filter.
  // Two-step, the same as the registrations table: the first click arms it,
  // the second commits. A pitch is somebody's work, so the destructive action
  // shouldn't be reachable by one stray click.
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function remove(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((r) => r.id !== id)); // optimistic
    setSelected(null);
    setConfirmDelete(false);
    startTransition(async () => {
      const res = await deleteSpeakerSubmission(id);
      if (!res.ok) setItems(previous); // revert on failure
      router.refresh();
    });
  }

  function changeStatus(id: string, status: SubmissionStatus) {
    const previous = items;
    // Optimistic update.
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    startTransition(async () => {
      const res = await updateSubmissionStatus(id, status);
      if (!res.ok) {
        setItems(previous); // revert
      } else {
        // Silence on a failed send would leave the team believing a speaker
        // had been told when they had not.
        setNotice(res.warning ?? null);
      }
      router.refresh();
    });
  }

  function promote(id: string) {
    startTransition(async () => {
      const res = await promoteToSpeaker(id);
      if (res.ok) {
        const patch = { promotedSpeakerId: res.speakerId };
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        );
        setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p
          role="status"
          className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
        >
          {notice}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <AdminInput
          placeholder="Search name, email, session…"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          className="max-w-xs"
        />
        {/* Work remaining, not status — see lib/admin/speaker-filters. Open is
            the landing view: the page opens on what is left to do rather than
            on every pitch of the season at once. */}
        <FilterChips
          value={filters.stage}
          onChange={(v) => update({ stage: v as SpeakerStage })}
          options={[
            { key: "open", label: "Open", count: counts.open },
            { key: "done", label: "Done", count: counts.done },
            { key: "all", label: "All", count: counts.all },
          ]}
        />
        <Combobox
          value={filters.track || "all"}
          onChange={(v) => update({ track: v === "all" ? "" : v })}
          options={[
            { value: "all", label: "All tracks" },
            ...TRACK_NAMES.map((t) => ({ value: t, label: t })),
          ]}
          className="w-52"
        />
        <div className="ml-auto flex items-center gap-3">
          <p className="text-sm tabular-nums text-muted-foreground">
            {isSpeakerFiltered(filters)
              ? `Showing ${filtered.length} of ${items.length}`
              : `${items.length} pitch${items.length === 1 ? "" : "es"}`}
          </p>
          <ButtonLink
            href={`/api/admin/speakers/export${qs ? `?${qs}` : ""}`}
            prefetch={false}
            variant="outline"
            size="sm"
          >
            Export CSV
          </ButtonLink>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border lg:overflow-visible">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className={TH}>Name</th>
              <th className={TH}>Session</th>
              <th className={TH}>Status</th>
              <th className={TH}>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {items.length === 0
                    ? "No pitches yet."
                    : filters.stage === "open"
                      ? "Nothing left to review. Switch to All to see them."
                      : "Nothing matches this view."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.sessionTitle}</div>
                    {r.track && <TrackChip name={r.track} />}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={selected !== null}
        onClose={() => {
          setSelected(null);
          setConfirmDelete(false);
        }}
        title={selected?.name}
      >
        {selected && (
          <div className="flex flex-col gap-5">
            {selected.headshotUrl && (
              <Image
                src={selected.headshotUrl}
                alt={selected.name}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            )}

            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </label>
              <div className="mt-1 flex items-center gap-3">
                <Combobox
                  value={selected.status}
                  disabled={pending}
                  onChange={(v) =>
                    changeStatus(selected.id, v as SubmissionStatus)
                  }
                  options={SUBMISSION_STATUSES.map((s) => ({
                    value: s,
                    label: s[0].toUpperCase() + s.slice(1),
                  }))}
                  className="w-44"
                />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              {selected.promotedSpeakerId ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-green-700">
                    ✓ Added to Speakers
                  </span>
                  <Link
                    href="/admin/content/speakers"
                    className="text-sm text-magenta hover:underline"
                  >
                    View
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Add to Speakers</div>
                    <div className="text-xs text-muted-foreground">
                      Create a public speaker profile from this submission.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => promote(selected.id)}
                    className="shrink-0"
                  >
                    {pending ? "…" : "Add"}
                  </Button>
                </div>
              )}
            </div>

            {selected.track && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Track
                </div>
                <div className="mt-1">
                  <TrackChip name={selected.track} />
                </div>
              </div>
            )}
            <Detail label="Session title" value={selected.sessionTitle} />
            <Detail label="Abstract" value={selected.abstract} multiline />
            <Detail label="Bio" value={selected.bio} multiline />
            {selected.company && (
              <Detail label="Company" value={selected.company} />
            )}
            <Detail label="Email" value={selected.email} />
            {selected.website && (
              <DetailLink label="Website" href={selected.website} />
            )}
            {selected.linkedin && (
              <DetailLink label="LinkedIn" href={selected.linkedin} />
            )}
            {selected.availability && (
              <Detail label="Availability" value={selected.availability} />
            )}
            <Detail
              label="Submitted"
              value={formatDateTime(selected.createdAt)}
            />

            {/* Last, and set apart. Everything above this line is reading a
                pitch or acting on it; this is the one control that destroys
                it, so it sits under a rule at the foot rather than beside the
                status picker where a mis-click lives. */}
            <div className="mt-1 border-t border-border pt-5">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Delete this pitch permanently?
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(selected.id)}
                    disabled={pending}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {pending ? "Deleting…" : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {selected.promotedSpeakerId
                      ? "Removes the pitch and its headshot. The speaker profile it created stays."
                      : "Removes the pitch and its headshot. Can't be undone."}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="shrink-0 text-sm font-medium text-red-600 hover:underline"
                  >
                    Delete pitch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={
          multiline ? "mt-1 whitespace-pre-wrap text-sm" : "mt-1 text-sm"
        }
      >
        {value}
      </div>
    </div>
  );
}

export function TrackChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {name}
    </span>
  );
}

function DetailLink({ label, href }: { label: string; href: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block break-all text-sm text-magenta hover:underline"
      >
        {href}
      </a>
    </div>
  );
}
