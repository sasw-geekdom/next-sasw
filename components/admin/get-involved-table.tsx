"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { ButtonLink } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/ui/controls";
import { FilterChips, ToggleChip } from "@/components/admin/ui/filter-chips";
import {
  applyGetInvolvedFilters,
  OPEN_STATUSES,
  getInvolvedSearchParams,
  isGetInvolvedFiltered,
  parseGetInvolvedFilters,
  type GetInvolvedFilters,
} from "@/lib/admin/get-involved-filters";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  deleteGetInvolved,
  updateGetInvolvedStatus,
} from "@/lib/admin/actions";
import {
  SUBMISSION_STATUSES,
  type GetInvolvedRow,
  type SubmissionStatus,
} from "@/lib/admin/types";
import { StatusBadge } from "@/components/admin/status-badge";
import { Combobox } from "@/components/ui/combobox";
import { PATH_LABELS, type GetInvolvedPath } from "@/lib/get-involved";

type View = "all" | GetInvolvedPath;

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sponsor", label: "Sponsor" },
  { key: "host", label: "Host" },
  { key: "general", label: "General" },
];

/**
 * The header cell, pinned.
 *
 * Nineteen rows sounds like too few to need this, and it would be if they were
 * one line each — but the Details column carries up to 180 characters of a
 * sponsor's goals or a host's event concept, so a row runs three or four lines
 * and the table is well over a screen. The negative offset matches `<main>`'s
 * padding: sticky pins to the scroll container's content box, so without it the
 * top of the first row shows above the pinned header.
 */
const TH =
  "sticky -top-5 z-10 bg-muted px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)] sm:-top-6";

/** The path-specific gist of a submission, for the Details column. */
function details(r: GetInvolvedRow): { headline?: string; body?: string } {
  if (r.path === "sponsor") {
    return {
      headline: r.budget,
      body: [r.anchorEvent, r.goals].filter(Boolean).join(" — "),
    };
  }
  if (r.path === "host") {
    return {
      headline: [r.venue, r.attendance && `~${r.attendance}`]
        .filter(Boolean)
        .join(" · "),
      body: r.eventConcept,
    };
  }
  return { body: r.question };
}

export function GetInvolvedTable({ rows }: { rows: GetInvolvedRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [items, setItems] = React.useState(rows);
  const [filters, setFilters] = React.useState<GetInvolvedFilters>(() =>
    parseGetInvolvedFilters(params),
  );
  const [selected, setSelected] = React.useState<GetInvolvedRow | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  // Sync when the server sends fresh rows (after revalidate) — render-phase
  // derived state, not an effect (avoids the setState-in-effect lint).
  const [prevRows, setPrevRows] = React.useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    setItems(rows);
  }

  function remove(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((r) => r.id !== id)); // optimistic
    setSelected(null);
    setConfirm(false);
    startTransition(async () => {
      const res = await deleteGetInvolved(id);
      if (!res.ok) setItems(previous); // revert on failure
      router.refresh();
    });
  }

  /**
   * Filters go to the URL with `history.replaceState`, not `router.replace`.
   *
   * `router.replace` would re-run the server component and refetch every row on
   * each keystroke. Nothing on this page reads the params after mount — the
   * initial state is seeded from them once — so the URL here is for linking and
   * for the export button to read, not a source of truth to round-trip through.
   */
  function update(patch: Partial<GetInvolvedFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const qs = getInvolvedSearchParams(next).toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }

  function changeStatus(id: string, status: SubmissionStatus) {
    const previous = items;
    // Optimistic: the drawer is open in front of the person who just chose it.
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelected((sel) => (sel && sel.id === id ? { ...sel, status } : sel));
    startTransition(async () => {
      const res = await updateGetInvolvedStatus(id, status);
      if (!res.ok) setItems(previous); // revert
      router.refresh();
    });
  }

  const filtered = React.useMemo(
    () => applyGetInvolvedFilters(items, filters),
    [items, filters],
  );

  const counts = React.useMemo(() => {
    const c: Record<View, number> = {
      all: items.length,
      sponsor: 0,
      host: 0,
      general: 0,
    };
    for (const r of items) c[r.path] += 1;
    return c;
  }, [items]);

  const openCount = React.useMemo(
    () => items.filter((r) => OPEN_STATUSES.has(r.status)).length,
    [items],
  );

  const view: View = filters.path === "" ? "all" : filters.path;
  const narrowed = isGetInvolvedFiltered(filters);
  const qs = getInvolvedSearchParams(filters).toString();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <AdminInput
          placeholder="Search name, company, event…"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          className="max-w-xs"
        />
        <FilterChips
          value={view}
          onChange={(v) => update({ path: v === "all" ? "" : v })}
          options={VIEWS.map((v) => ({ ...v, count: counts[v.key] }))}
        />
        {/* Only once something has been worked. Before that every row is open
            and the chip would filter nineteen rows down to nineteen. */}
        {openCount < items.length && (
          <ToggleChip
            label="Open"
            count={openCount}
            pressed={filters.open === "yes"}
            onClick={() => update({ open: filters.open ? "" : "yes" })}
          />
        )}
        <div className="ml-auto flex items-center gap-3">
          {/* What the table is showing, beside the controls that decided it. */}
          <p className="text-sm tabular-nums text-muted-foreground">
            {narrowed
              ? `Showing ${filtered.length} of ${items.length}`
              : `${items.length} submission${items.length === 1 ? "" : "s"}`}
          </p>
          {/* Carries the filters, so it exports the view rather than the
              collection — see lib/admin/get-involved-filters. */}
          <ButtonLink
            href={`/api/admin/get-involved/export${qs ? `?${qs}` : ""}`}
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
              <th className={TH}>Contact</th>
              <th className={TH}>Company</th>
              <th className={TH}>Path</th>
              <th className={TH}>Status</th>
              <th className={TH}>Details</th>
              <th className={TH}>Received</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {narrowed
                    ? "Nothing matches this view."
                    : "No submissions yet."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const d = details(r);
                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelected(r);
                      setConfirm(false);
                    }}
                    className="cursor-pointer border-b border-border align-top last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.company}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.role}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                        {PATH_LABELS[r.path]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {d.headline && (
                        <div className="text-xs font-medium text-foreground">
                          {d.headline}
                        </div>
                      )}
                      {d.body && (
                        <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">
                          {d.body.length > 180
                            ? `${d.body.slice(0, 180)}…`
                            : d.body}
                        </p>
                      )}
                      {r.path === "host" && r.audience.length > 0 && (
                        <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">
                          {r.audience.join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {PATH_LABELS[selected.path]}
              </span>
            </div>

            {/* Set here rather than inline in the row, the same as the speakers
                drawer: changing where a sponsor stands is a decision you make
                having read what they wrote, and this is where you have read it.
                No email is sent — see `updateGetInvolvedStatus`. */}
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
                  options={SUBMISSION_STATUSES.map((st) => ({
                    value: st,
                    label: st[0].toUpperCase() + st.slice(1),
                  }))}
                  className="w-44"
                />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <Detail label="Email" value={selected.email} />
            <Detail label="Phone" value={selected.phone} />
            <Detail label="Company" value={selected.company} />
            <Detail label="Role" value={selected.role} />

            {selected.path === "sponsor" && (
              <>
                {selected.budget && (
                  <Detail label="Budget" value={selected.budget} />
                )}
                {selected.anchorEvent && (
                  <Detail label="Anchor event" value={selected.anchorEvent} />
                )}
                {selected.goals && (
                  <Detail label="Goals" value={selected.goals} multiline />
                )}
              </>
            )}

            {selected.path === "host" && (
              <>
                {selected.eventConcept && (
                  <Detail
                    label="Event concept"
                    value={selected.eventConcept}
                    multiline
                  />
                )}
                {selected.audience.length > 0 && (
                  <Detail
                    label="Audience"
                    value={selected.audience.join(", ")}
                  />
                )}
                {selected.attendance && (
                  <Detail
                    label="Expected attendance"
                    value={selected.attendance}
                  />
                )}
                {selected.preferredTime && (
                  <Detail
                    label="Preferred time"
                    value={selected.preferredTime}
                  />
                )}
                {selected.venue && (
                  <Detail label="Venue" value={selected.venue} />
                )}
                {selected.coSponsors && (
                  <Detail
                    label="Co-sponsors / partners"
                    value={selected.coSponsors}
                    multiline
                  />
                )}
              </>
            )}

            {selected.path === "general" && selected.question && (
              <Detail label="Question" value={selected.question} multiline />
            )}

            {selected.heardAbout && (
              <Detail label="Heard about" value={selected.heardAbout} />
            )}
            {selected.notes && (
              <Detail label="Anything else" value={selected.notes} multiline />
            )}
            <Detail
              label="Received"
              value={formatDateTime(selected.createdAt)}
            />

            <div className="mt-2 border-t border-border pt-4">
              {confirm ? (
                <div className="flex items-center gap-3">
                  <button
                    disabled={pending}
                    onClick={() => remove(selected.id)}
                    className="inline-flex h-9 items-center rounded-md bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {pending ? "Deleting…" : "Delete permanently"}
                  </button>
                  <button
                    onClick={() => setConfirm(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                  Delete submission
                </button>
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
