"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Drawer } from "@/components/ui/drawer";
import {
  saveSpeaker,
  deleteSpeaker,
  reorderSpeakers,
} from "@/lib/admin/cms-actions";
import { useDragReorder } from "@/lib/admin/use-drag-reorder";
import { imageFileError, MAX_IMAGE_LABEL, PHOTO_TYPES } from "@/lib/images";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { SpeakerRow } from "@/lib/admin/cms-types";

export function SpeakerManager({ rows }: { rows: SpeakerRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<SpeakerRow | "new" | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>(
    {},
  );

  const { items, draggingId, dragProps } = useDragReorder(rows, (ids) => {
    startTransition(async () => {
      await reorderSpeakers(ids);
      router.refresh();
    });
  });

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

    // Catch an oversized headshot here. Past the server action's body limit
    // the request is rejected by the framework before our code runs, which
    // surfaces as an unhandled runtime error rather than a form message.
    const picked = form.get("image");
    if (picked instanceof File && picked.size > 0) {
      const problem = imageFileError(picked, PHOTO_TYPES);
      if (problem) {
        setError(problem);
        return;
      }
    }

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
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Drag to order — the first six lead the homepage lineup, the rest fill
          out /speakers.
        </p>
        <Button onClick={() => open("new")}>Add speaker</Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No speakers yet. Add the first one.
        </div>
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
              <div className="flex items-center gap-3">
                {row.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.imageUrl}
                    alt={row.name}
                    draggable={false}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-muted text-lg font-medium uppercase text-muted-foreground">
                    {row.name[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.name}</div>
                  {(row.title || row.company) && (
                    <div className="truncate text-xs text-muted-foreground">
                      {[row.title, row.company].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {row.linkedin ? (
                    <a
                      href={row.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      draggable={false}
                      className="text-xs text-magenta hover:underline"
                    >
                      LinkedIn
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Needs details
                    </span>
                  )}
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

            <SlugFields
              // Remount per speaker so the drafts reset with the drawer.
              key={current?.id ?? "new"}
              current={current}
              issues={issues}
            />

            {/* Role + org — the caption line under the name on the public
                lineup card. Optional, so a speaker can go up before their
                title is confirmed. */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Role (optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Founder & CEO"
                  defaultValue={current?.title}
                />
                {issues.title?.[0] && <FieldError>{issues.title[0]}</FieldError>}
              </div>
              <div>
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Geekdom"
                  defaultValue={current?.company}
                />
                {issues.company?.[0] && (
                  <FieldError>{issues.company[0]}</FieldError>
                )}
              </div>
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
                accept={PHOTO_TYPES.join(",")}
                className="pt-2.5"
                required={!current}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                JPEG, PNG, or WebP · under {MAX_IMAGE_LABEL}. Portrait crops
                best — the public card is 4:5.
              </p>
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

/**
 * Name plus the public URL it produces.
 *
 * The slug field is pre-filled with the speaker's existing slug rather than
 * left blank, which is what keeps a rename from silently moving a published
 * page — you have to clear or edit the slug on purpose. Clearing it falls
 * back to deriving from the name. The old URL keeps redirecting either way.
 */
function SlugFields({
  current,
  issues,
}: {
  current: SpeakerRow | null;
  issues: Record<string, string[] | undefined>;
}) {
  const [name, setName] = React.useState(current?.name ?? "");
  const [slug, setSlug] = React.useState(current?.slug ?? "");

  // Mirrors what the action will land on, minus the collision suffix — it
  // can't know what's taken without a round trip, and a "-2" surprise on
  // save is rare enough to explain there rather than predict here.
  const preview = slugify(slug.trim() || name);

  return (
    <>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {issues.name?.[0] && <FieldError>{issues.name[0]}</FieldError>}
      </div>

      <div>
        <Label htmlFor="slug">Public URL</Label>
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            /speakers/
          </span>
          <Input
            id="slug"
            name="slug"
            value={slug}
            placeholder={slugify(name || "name")}
            onChange={(e) => setSlug(e.target.value)}
            className="font-mono"
          />
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
          {preview ? `sasw.co/speakers/${preview}` : "sasw.co/speakers/…"}
        </p>
        {issues.slug?.[0] && <FieldError>{issues.slug[0]}</FieldError>}
        {current && slug.trim() && slugify(slug) !== current.slug && (
          <p className="mt-1 text-xs text-amber-600">
            Changing this moves the page. {current.slug} will redirect here.
          </p>
        )}
      </div>
    </>
  );
}
