"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Combobox } from "@/components/ui/combobox";
import { AdminInput } from "@/components/admin/ui/controls";
import { RegistrationsSummary } from "@/components/admin/registrations-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/format";
import { deleteRegistration } from "@/lib/admin/actions";
import type { RegistrationRow } from "@/lib/admin/types";
import {
  applyFilters,
  facetCounts,
  toSearchParams,
  type RegistrationFilters,
} from "@/lib/admin/registration-filters";

/**
 * Sorting, on the three columns that answer a question someone actually has:
 * who is this (name), where are they from (company), and when did they sign up
 * (registered). The rest are booleans the facets already cut on, and a sort by
 * "yes/no" is a filter with extra steps.
 */
type SortKey = "name" | "company" | "createdAt";
type Sort = { key: SortKey; dir: "asc" | "desc" };

// Newest first, matching `listRegistrations`'s own `orderBy`. The table should
// open in the order the query hands it over, not re-sorted on arrival.
const DEFAULT_SORT: Sort = { key: "createdAt", dir: "desc" };

const TH =
  "sticky -top-5 z-10 bg-muted px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)] sm:-top-6";

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const Arrow = active && sort.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th
      scope="col"
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={TH}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground"
      >
        {label}
        <Arrow
          className={cn(
            "h-3.5 w-3.5 transition-opacity",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
          )}
          strokeWidth={2}
        />
      </button>
    </th>
  );
}

/**
 * A facet, as the system's own select — and only for the two dimensions that
 * warrant one.
 *
 * `describesYou` has fifteen values and `saTenure` seven, which is exactly what
 * `Combobox` is for since it types to filter. Every binary dimension is a card
 * in the strip above instead: a dropdown to choose between yes and no is a menu
 * standing in for a switch.
 *
 * Width follows the content rather than a fixed `w-56`. Four identical
 * fixed-width selects sitting empty read as a form waiting to be filled in,
 * which is what made the row look like a stack of blanks; sized to their label
 * they read as controls, and the one that is set is visibly wider than the ones
 * that are not.
 */
function Facet({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; count: number; label?: string }[];
}) {
  return (
    <div className="flex items-center gap-1">
      <Combobox
        placeholder={label}
        searchPlaceholder={`Filter ${label.toLowerCase()}…`}
        emptyMessage="No matches."
        value={value}
        onChange={onChange}
        size="sm"
        className="w-auto min-w-[10rem] max-w-[18rem]"
        options={options.map((o) => ({
          value: o.value,
          label: `${o.label ?? o.value} · ${o.count}`,
        }))}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={`Clear ${label}`}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{children ?? "—"}</dd>
    </div>
  );
}

export function RegistrationsTable({
  rows,
  initialFilters,
  initialDense,
}: {
  rows: RegistrationRow[];
  initialFilters: RegistrationFilters;
  initialDense: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(rows);
  const [filters, setFilters] = React.useState(initialFilters);
  const [sort, setSort] = React.useState<Sort>(DEFAULT_SORT);
  const [dense, setDense] = React.useState(initialDense);
  const [detail, setDetail] = React.useState<RegistrationRow | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Sync when the server sends fresh rows (after revalidate) — render-phase
  // derived state, not an effect (avoids the setState-in-effect lint).
  const [prevRows, setPrevRows] = React.useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    setItems(rows);
  }

  /**
   * Filters go to the URL with `history.replaceState`, not `router.replace`.
   *
   * The page is `force-dynamic`, so a real navigation would refetch all 274
   * rows from Firestore on every keystroke to produce a list the browser
   * already has. This writes the address bar and nothing else: the filtering
   * stays instant, the view is still linkable and survives a refresh, and the
   * Export link below reads the same params the server route parses.
   */
  function update(patch: Partial<RegistrationFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const qs = toSearchParams(next).toString();
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname,
    );
  }

  function toggleDense() {
    const next = !dense;
    setDense(next);
    // Same trick the sidebar uses for its collapsed state: a cookie the server
    // reads, so the first paint matches and there is no flash of the other
    // density on every navigation.
    document.cookie = `admin_reg_density=${next ? "compact" : "comfortable"}; path=/; max-age=31536000; samesite=lax`;
  }

  function remove(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((r) => r.id !== id)); // optimistic
    setConfirmId(null);
    setDetail(null);
    startTransition(async () => {
      const res = await deleteRegistration(id);
      if (!res.ok) setItems(previous); // revert on failure
      router.refresh();
    });
  }

  const filtered = React.useMemo(
    () => applyFilters(items, filters),
    [items, filters],
  );

  /**
   * Sorted after filtering, and blanks always sink.
   *
   * A registration need not carry a company, and 62 of 274 do not. Sorted
   * naively those land in one block at whichever end the direction points, so
   * ascending opens on a screen of em dashes — the sort appears not to have
   * worked. Held at the bottom in both directions the column reads as "the ones
   * that have a company, ordered", which is the question being asked of it.
   */
  const visible = React.useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "createdAt") return (a.createdAt - b.createdAt) * dir;
      const av = (sort.key === "name" ? a.name : (a.company ?? "")).trim();
      const bv = (sort.key === "name" ? b.name : (b.company ?? "")).trim();
      if (!av !== !bv) return av ? -1 : 1;
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * dir;
    });
  }, [filtered, sort]);

  // A new column starts in the direction that column is usually read: names
  // A–Z, dates newest first. Clicking the active one reverses it.
  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "createdAt" ? "desc" : "asc" },
    );
  }

  const segments = React.useMemo(
    () => facetCounts(items, filters, "segment"),
    [items, filters],
  );
  const tenures = React.useMemo(
    () => facetCounts(items, filters, "tenure"),
    [items, filters],
  );

  const qs = toSearchParams(filters).toString();
  // 61px a row is the site's rhythm inside a console. 2.5 lands a comfortable
  // row near 48 and a compact one near 40, which is the density the sidebar
  // and topbar are already drawn at.
  const pad = dense ? "py-1.5" : "py-2.5";

  return (
    <div className="flex flex-col gap-5">
      {/* The overview is the filter bar — see registrations-summary. It used to
          sit above a separate row of chips showing the same counts, which is
          what made the page feel like more chrome than table. */}
      <RegistrationsSummary rows={items} filters={filters} onChange={update} />

      {/* One row, and only what the cards cannot do: free text, and the two
          dimensions with fifteen and seven values. Everything binary is a card
          above. */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminInput
          placeholder="Search name, email, company, ZIP…"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          className="max-w-xs"
        />
        <Facet
          label="Describes you"
          value={filters.segment}
          onChange={(segment) => update({ segment })}
          options={segments}
        />
        <Facet
          label="Time in SA"
          value={filters.tenure}
          onChange={(tenure) => update({ tenure })}
          options={tenures}
        />

        <div className="ml-auto flex items-center gap-3">
          {/* What you are looking at, which the cards alone do not say once a
              search is also on. Always rendered so the row never reflows, and
              tabular so the number does not jitter as you type. */}
          <p className="text-sm tabular-nums text-muted-foreground">
            {visible.length === items.length
              ? `${items.length} registration${items.length === 1 ? "" : "s"}`
              : `Showing ${visible.length} of ${items.length}`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleDense}
            aria-pressed={dense}
          >
            {dense ? "Comfortable" : "Compact"}
          </Button>
          {/* Carries the filters, so it exports the view rather than the
              collection — see lib/admin/registration-filters. */}
          <ButtonLink
            href={`/api/admin/registrations/export${qs ? `?${qs}` : ""}`}
            prefetch={false}
            variant="outline"
            size="sm"
          >
            Export CSV
          </ButtonLink>
        </div>
      </div>

      {/* `overflow-x-auto` makes this a scroll container on both axes — the
          spec promotes the other axis to `auto` — and a scroll container with
          no height never scrolls, so a sticky header inside it has nothing to
          stick to. Above `lg` the overflow is released and the header sticks
          to `<main>`, which is the shell's real scrollport. Below it, the
          horizontal scroll matters more than the sticky header: nobody scans
          274 rows on a phone. */}
      <div className="overflow-x-auto rounded-lg border border-border lg:overflow-visible">
        <table className="w-full text-sm">
          {/* Opaque `bg-muted`, not `bg-muted/50`: rows scroll underneath a
              sticky header, and a translucent one shows them through it. The
              bottom rule is an inset shadow rather than a border because
              Tailwind collapses table borders, and a collapsed border does not
              travel with a sticky cell.

              The offset is negative and matches `<main>`'s own padding, which
              is not a nudge. A sticky element inside a scroll container pins to
              that container's *content* box, so at `top-0` it parked 24px below
              the topbar and rows scrolled through the gap above it — visible on
              screen as a sliver of the row that just left. */}
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <SortHeader
                label="Name"
                sortKey="name"
                sort={sort}
                onSort={toggleSort}
              />
              <SortHeader
                label="Company"
                sortKey="company"
                sort={sort}
                onSort={toggleSort}
              />
              <th scope="col" className={TH}>
                Circuits
              </th>
              <th scope="col" className={TH}>
                Volunteer
              </th>
              <th scope="col" className={TH}>
                Consent
              </th>
              <SortHeader
                label="Registered"
                sortKey="createdAt"
                sort={sort}
                onSort={toggleSort}
              />
              <th className={TH}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {items.length === 0
                    ? "No registrations yet."
                    : "Nothing matches these filters."}
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className={cn("px-4", pad)}>
                    {/* A button, not a click handler on the row: the row also
                        holds a delete control, and a whole clickable row with
                        a destructive button inside it is a misclick waiting to
                        happen. This is also what makes the drawer reachable
                        from the keyboard. */}
                    {/* The email stays on screen in both densities.
                        Compact used to drop this line, and search matches on
                        email, company, role and ZIP — so searching "utsa.edu"
                        returned a screen of rows with the matching text
                        nowhere on it, and the results looked arbitrary.
                        Compact moves it inline and truncates instead. */}
                    <div
                      className={cn(
                        "min-w-0",
                        dense && "flex items-baseline gap-2",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setDetail(r)}
                        className="shrink-0 text-left font-medium hover:underline"
                      >
                        {r.name}
                      </button>
                      <span
                        className={cn(
                          "text-xs text-muted-foreground",
                          dense ? "truncate" : "block",
                        )}
                      >
                        {r.email}
                        {!dense && r.zip ? ` · ${r.zip}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className={cn("px-4", pad)}>
                    <div>{r.company ?? "—"}</div>
                    {!dense && r.role && (
                      <div className="text-xs text-muted-foreground">
                        {r.role}
                      </div>
                    )}
                  </td>
                  <td className={cn("px-4 text-xs text-muted-foreground", pad)}>
                    {r.circuits.length > 0 ? r.circuits.join(", ") : "—"}
                  </td>
                  <td className={cn("px-4", pad)}>
                    {r.volunteerInterested ? (
                      <div>
                        <span className="font-medium text-foreground">Yes</span>
                        {!dense && r.volunteerDays.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {r.volunteerDays.join(", ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={cn("px-4", pad)}>
                    {r.sponsorConsent ? (
                      <span className="font-medium text-foreground">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={cn("px-4 text-muted-foreground", pad)}>
                    {formatDate(r.createdAt)}
                  </td>
                  <td className={cn("px-4 text-right", pad)}>
                    {confirmId === r.id ? (
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => remove(r.id)}
                          disabled={pending}
                          className="font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmId(r.id)}
                        aria-label={`Delete ${r.name}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Everything the table has no column for. Seven of the seventeen fields
          on a registration were reachable only through the CSV — including the
          volunteer notes, which are free text a volunteer wrote and which
          nobody could read in the UI at all. */}
      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name}
      >
        {detail && (
          <dl className="flex flex-col gap-4">
            <Field label="Email">{detail.email}</Field>
            <Field label="Describes you">{detail.describesYou}</Field>
            <Field label="Company">{detail.company}</Field>
            <Field label="Role">{detail.role}</Field>
            <Field label="Industry">{detail.industry}</Field>
            <Field label="Time in SA">{detail.saTenure}</Field>
            <Field label="ZIP">{detail.zip}</Field>
            <Field label="First time">{detail.firstTime ? "Yes" : "No"}</Field>
            <Field label="Circuits">
              {detail.circuits.length > 0 ? detail.circuits.join(", ") : null}
            </Field>
            <Field label="Volunteer">
              {detail.volunteerInterested
                ? detail.volunteerDays.length > 0
                  ? `Yes · ${detail.volunteerDays.join(", ")}`
                  : "Yes"
                : "No"}
            </Field>
            {detail.volunteerNotes && (
              <Field label="Volunteer preferences">
                <span className="whitespace-pre-wrap">
                  {detail.volunteerNotes}
                </span>
              </Field>
            )}
            <Field label="Sponsor consent">
              {detail.sponsorConsent ? "Yes" : "No"}
            </Field>
            <Field label="Registered">{formatDateTime(detail.createdAt)}</Field>
            {/* Read-only, deliberately. `checkIn()` records who and when and
                has its own portal built for a badge queue; a stray click in a
                data table should not mark somebody present under your name. */}
            <Field label="Checked in">
              {detail.checkedIn
                ? `${formatDateTime(detail.checkedInAt)}${detail.checkedInBy ? ` · ${detail.checkedInBy}` : ""}`
                : "Not yet"}
            </Field>
          </dl>
        )}
      </Drawer>
    </div>
  );
}
