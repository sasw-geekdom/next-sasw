"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer } from "@/components/ui/drawer";
import { useDragReorder } from "@/lib/admin/use-drag-reorder";
import { cn } from "@/lib/utils";
import type { SaveResult } from "@/lib/admin/cms-actions";
import type { LogoEntityRow } from "@/lib/admin/cms-types";

interface Props {
  noun: string; // "partner" / "sponsor"
  rows: LogoEntityRow[];
  saveAction: (form: FormData) => Promise<SaveResult>;
  deleteAction: (id: string) => Promise<SaveResult>;
  reorderAction: (ids: string[]) => Promise<SaveResult>;
}

export function LogoEntityManager({
  noun,
  rows,
  saveAction,
  deleteAction,
  reorderAction,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<LogoEntityRow | "new" | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>(
    {},
  );

  const { items, draggingId, dragProps } = useDragReorder(rows, (ids) => {
    startTransition(async () => {
      await reorderAction(ids);
      router.refresh();
    });
  });

  function open(row: LogoEntityRow | "new") {
    setError(null);
    setIssues({});
    setEditing(row);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIssues({});
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveAction(form);
      if (!res.ok) {
        setError(res.error);
        setIssues(res.issues ?? {});
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete(row: LogoEntityRow) {
    if (!confirm(`Delete ${row.name}?`)) return;
    startTransition(async () => {
      await deleteAction(row.id);
      setEditing(null);
      router.refresh();
    });
  }

  const current = editing === "new" ? null : editing;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Drag cards to set the display order — the public site follows it.
        </p>
        <Button onClick={() => open("new")}>Add {noun}</Button>
      </div>

      {items.length === 0 ? (
        <Empty noun={noun} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((row, i) => (
            <div
              key={row.id}
              {...dragProps(i)}
              className={cn(
                "flex cursor-grab flex-col gap-3 rounded-lg border border-border bg-white p-4 active:cursor-grabbing",
                draggingId === row.id && "border-magenta opacity-60",
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground/60">
                <GripVertical className="h-4 w-4" aria-hidden="true" />
                <span className="font-mono text-[10px] tabular-nums">
                  {i + 1}
                </span>
              </div>
              <div className="flex h-24 items-center justify-center rounded-md bg-muted/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.imageUrl}
                  alt={row.name}
                  draggable={false}
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
              <div className="font-medium">{row.name}</div>
              <a
                href={row.link}
                target="_blank"
                rel="noreferrer"
                draggable={false}
                className="truncate text-xs text-magenta hover:underline"
              >
                {row.link}
              </a>
              <div className="mt-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => open(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? `Edit ${noun}` : `Add ${noun}`}
      >
        {editing !== null && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            {current && <input type="hidden" name="id" value={current.id} />}

            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={current?.name} required />
              {issues.name?.[0] && <FieldError>{issues.name[0]}</FieldError>}
            </div>

            <div>
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                name="link"
                type="url"
                placeholder="https://"
                defaultValue={current?.link}
                required
              />
              {issues.link?.[0] && <FieldError>{issues.link[0]}</FieldError>}
            </div>

            <div>
              <Label htmlFor="image">
                Logo {current ? "(leave blank to keep current)" : ""}
              </Label>
              {current?.imageUrl && (
                <Image
                  src={current.imageUrl}
                  alt={current.name}
                  width={80}
                  height={80}
                  className="mb-2 h-20 w-20 object-contain"
                />
              )}
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="pt-2.5"
                required={!current}
              />
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

function Empty({ noun }: { noun: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
      No {noun}s yet. Add the first one.
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
