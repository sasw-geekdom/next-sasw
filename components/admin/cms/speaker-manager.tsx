"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Drawer } from "@/components/ui/drawer";
import { saveSpeaker, deleteSpeaker } from "@/lib/admin/cms-actions";
import type { SpeakerRow } from "@/lib/admin/cms-types";

export function SpeakerManager({ rows }: { rows: SpeakerRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<SpeakerRow | "new" | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>(
    {},
  );

  function open(row: SpeakerRow | "new") {
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
      const res = await saveSpeaker(form);
      if (!res.ok) {
        setError(res.error);
        setIssues(res.issues ?? {});
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete(row: SpeakerRow) {
    if (!confirm(`Delete ${row.name}?`)) return;
    startTransition(async () => {
      await deleteSpeaker(row.id);
      setEditing(null);
      router.refresh();
    });
  }

  const current = editing === "new" ? null : editing;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={() => open("new")}>Add speaker</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No speakers yet. Add the first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.imageUrl}
                  alt={row.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.name}</div>
                  <a
                    href={row.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-magenta hover:underline"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
              <p className="line-clamp-3 text-xs text-muted-foreground">{row.bio}</p>
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
        title={current ? "Edit speaker" : "Add speaker"}
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
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={5} defaultValue={current?.bio} required />
              {issues.bio?.[0] && <FieldError>{issues.bio[0]}</FieldError>}
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                name="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/…"
                defaultValue={current?.linkedin}
                required
              />
              {issues.linkedin?.[0] && <FieldError>{issues.linkedin[0]}</FieldError>}
            </div>

            <div>
              <Label htmlFor="image">
                Headshot {current ? "(leave blank to keep current)" : ""}
              </Label>
              {current?.imageUrl && (
                <Image
                  src={current.imageUrl}
                  alt={current.name}
                  width={80}
                  height={80}
                  className="mb-2 h-20 w-20 rounded-full object-cover"
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
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
