"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { RegistrationRow } from "@/lib/admin/types";

export function RegistrationsTable({ rows }: { rows: RegistrationRow[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.company, r.role]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
        <ButtonLink
          href="/api/admin/registrations/export"
          prefetch={false}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          Export CSV
        </ButtonLink>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No registrations yet.
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
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.company ?? "—"}</td>
                  <td className="px-4 py-3">{r.role ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.createdAt)}
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
