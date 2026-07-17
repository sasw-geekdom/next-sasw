"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { deleteRegistration } from "@/lib/admin/actions";
import type { RegistrationRow } from "@/lib/admin/types";

// The two "tag" views from the form requirements: volunteer interest and
// sponsor consent both live as filters here rather than separate pages.
type View = "all" | "volunteers" | "consent";

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "All" },
  { key: "volunteers", label: "Volunteers" },
  { key: "consent", label: "Sponsor consent" },
];

export function RegistrationsTable({ rows }: { rows: RegistrationRow[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(rows);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>("all");
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
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
    setConfirmId(null);
    startTransition(async () => {
      const res = await deleteRegistration(id);
      if (!res.ok) setItems(previous); // revert on failure
      router.refresh();
    });
  }

  const filtered = React.useMemo(() => {
    let list = items;
    if (view === "volunteers") list = list.filter((r) => r.volunteerInterested);
    if (view === "consent") list = list.filter((r) => r.sponsorConsent);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.name, r.email, r.company, r.role, r.zip]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [items, query, view]);

  const counts = React.useMemo(
    () => ({
      all: items.length,
      volunteers: items.filter((r) => r.volunteerInterested).length,
      consent: items.filter((r) => r.sponsorConsent).length,
    }),
    [items],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, company, ZIP…"
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
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Circuits</th>
              <th className="px-4 py-3 font-medium">Volunteer</th>
              <th className="px-4 py-3 font-medium">Consent</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {view === "all"
                    ? "No registrations yet."
                    : "Nothing matches this view."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.email}
                      {r.zip ? ` · ${r.zip}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.company ?? "—"}</div>
                    {r.role && (
                      <div className="text-xs text-muted-foreground">
                        {r.role}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.circuits.length > 0 ? r.circuits.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.volunteerInterested ? (
                      <div>
                        <span className="font-medium text-foreground">Yes</span>
                        {r.volunteerDays.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {r.volunteerDays.join(", ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.sponsorConsent ? (
                      <span className="font-medium text-foreground">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
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
    </div>
  );
}
