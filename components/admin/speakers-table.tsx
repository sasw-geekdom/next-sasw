"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { updateSubmissionStatus } from "@/lib/admin/actions";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  SUBMISSION_STATUSES,
  type SpeakerSubmissionRow,
  type SubmissionStatus,
} from "@/lib/admin/types";

export function SpeakersTable({ rows }: { rows: SpeakerSubmissionRow[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(rows);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | SubmissionStatus>(
    "all",
  );
  const [selected, setSelected] = React.useState<SpeakerSubmissionRow | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setItems(rows), [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.name, r.email, r.sessionTitle, r.company]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [items, query, statusFilter]);

  function changeStatus(id: string, status: SubmissionStatus) {
    const previous = items;
    // Optimistic update.
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    startTransition(async () => {
      const res = await updateSubmissionStatus(id, status);
      if (!res.ok) {
        setItems(previous); // revert
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, session…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | SubmissionStatus)
          }
          className="h-11 rounded-md border border-border bg-white px-3 text-sm capitalize"
        >
          <option value="all">All statuses</option>
          {SUBMISSION_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {items.length}
        </span>
        <ButtonLink
          href="/api/admin/speakers/export"
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
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No submissions yet.
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
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.sessionTitle}</td>
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
        onClose={() => setSelected(null)}
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
                <select
                  value={selected.status}
                  disabled={pending}
                  onChange={(e) =>
                    changeStatus(
                      selected.id,
                      e.target.value as SubmissionStatus,
                    )
                  }
                  className="h-10 rounded-md border border-border bg-white px-3 text-sm capitalize"
                >
                  {SUBMISSION_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <Detail label="Session title" value={selected.sessionTitle} />
            <Detail label="Abstract" value={selected.abstract} multiline />
            <Detail label="Bio" value={selected.bio} multiline />
            {selected.company && <Detail label="Company" value={selected.company} />}
            <Detail label="Email" value={selected.email} />
            {selected.website && <DetailLink label="Website" href={selected.website} />}
            {selected.linkedin && <DetailLink label="LinkedIn" href={selected.linkedin} />}
            {selected.availability && (
              <Detail label="Availability" value={selected.availability} />
            )}
            <Detail label="Submitted" value={formatDateTime(selected.createdAt)} />
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
      <div className={multiline ? "mt-1 whitespace-pre-wrap text-sm" : "mt-1 text-sm"}>
        {value}
      </div>
    </div>
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
