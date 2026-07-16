"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { GetInvolvedRow } from "@/lib/admin/types";
import { PATH_LABELS, type GetInvolvedPath } from "@/lib/get-involved";

type View = "all" | GetInvolvedPath;

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sponsor", label: "Sponsor" },
  { key: "host", label: "Host" },
  { key: "general", label: "General" },
];

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
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>("all");

  const filtered = React.useMemo(() => {
    let list = rows;
    if (view !== "all") list = list.filter((r) => r.path === view);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.name, r.email, r.company, r.role, r.eventConcept, r.question]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [rows, query, view]);

  const counts = React.useMemo(() => {
    const c: Record<View, number> = {
      all: rows.length,
      sponsor: 0,
      host: 0,
      general: 0,
    };
    for (const r of rows) c[r.path] += 1;
    return c;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, company, event…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1 rounded-md border border-border bg-muted/40 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              aria-pressed={view === v.key}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                view === v.key
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  view === v.key ? "text-white/60" : "text-muted-foreground/60",
                )}
              >
                {counts[v.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {view === "all"
                    ? "No submissions yet."
                    : "Nothing on this path yet."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const d = details(r);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border align-top last:border-0 hover:bg-muted/40"
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
    </div>
  );
}
