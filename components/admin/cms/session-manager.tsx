"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { saveSession, deleteSession } from "@/lib/admin/cms-actions";
import { formatDateTime } from "@/lib/format";
import { TRACKS } from "@/lib/tracks";
import type {
  SessionRow,
  SpeakerRow,
  SessionParticipant,
  ParticipantRole,
} from "@/lib/admin/cms-types";

function toLocalInput(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function SessionManager({
  rows,
  speakers,
}: {
  rows: SessionRow[];
  speakers: SpeakerRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<SessionRow | "new" | null>(null);
  const [participants, setParticipants] = React.useState<SessionParticipant[]>(
    [],
  );
  const [track, setTrack] = React.useState("");
  const [pickerValue, setPickerValue] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>(
    {},
  );

  const speakerName = React.useCallback(
    (id: string) => speakers.find((s) => s.id === id)?.name ?? "Unknown",
    [speakers],
  );

  function open(row: SessionRow | "new") {
    setError(null);
    setIssues({});
    setParticipants(
      row === "new"
        ? []
        : row.participants.map((p) => ({ speakerId: p.speakerId, role: p.role })),
    );
    setTrack(row === "new" ? "" : (row.track ?? ""));
    setPickerValue("");
    setEditing(row);
  }

  function addParticipant(speakerId: string) {
    if (!speakerId) return;
    setParticipants((prev) =>
      prev.some((p) => p.speakerId === speakerId)
        ? prev
        : [...prev, { speakerId, role: "speaker" }],
    );
    setPickerValue("");
  }

  function setRole(speakerId: string, role: ParticipantRole) {
    setParticipants((prev) =>
      prev.map((p) => (p.speakerId === speakerId ? { ...p, role } : p)),
    );
  }

  function removeParticipant(speakerId: string) {
    setParticipants((prev) => prev.filter((p) => p.speakerId !== speakerId));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIssues({});
    const form = new FormData(e.currentTarget);
    form.set("participants", JSON.stringify(participants));
    form.set("track", track);
    startTransition(async () => {
      const res = await saveSession(form);
      if (!res.ok) {
        setError(res.error);
        setIssues(res.issues ?? {});
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete(row: SessionRow) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    startTransition(async () => {
      await deleteSession(row.id);
      setEditing(null);
      router.refresh();
    });
  }

  const current = editing === "new" ? null : editing;
  const available = speakers.filter(
    (s) => !participants.some((p) => p.speakerId === s.id),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        {speakers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add speakers first to assign them to sessions.
          </p>
        )}
        <Button className="ml-auto" onClick={() => open("new")}>
          Add session
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No sessions yet. Build the schedule.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold">
                      {row.title}
                    </span>
                    {row.track && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {row.track}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(row.startsAt)}
                    {row.endsAt ? ` – ${formatDateTime(row.endsAt)}` : ""} ·{" "}
                    {row.location}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => open(row)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
                    Delete
                  </Button>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {row.description}
              </p>
              {row.participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {row.participants.map((p) => (
                    <Badge
                      key={p.speakerId}
                      tone={p.role === "moderator" ? "magenta" : "blue"}
                    >
                      {p.name}
                      {p.role === "moderator" ? " · mod" : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? "Edit session" : "Add session"}
      >
        {editing !== null && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            {current && <input type="hidden" name="id" value={current.id} />}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={current?.title} required />
              {issues.title?.[0] && <FieldError>{issues.title[0]}</FieldError>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={current?.description}
                required
              />
              {issues.description?.[0] && (
                <FieldError>{issues.description[0]}</FieldError>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startsAt">Starts</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(current?.startsAt ?? null)}
                  required
                />
                {issues.startsAt?.[0] && (
                  <FieldError>{issues.startsAt[0]}</FieldError>
                )}
              </div>
              <div>
                <Label htmlFor="endsAt">Ends (optional)</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(current?.endsAt ?? null)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Room, venue, floor…"
                defaultValue={current?.location}
                required
              />
              {issues.location?.[0] && (
                <FieldError>{issues.location[0]}</FieldError>
              )}
            </div>

            <div>
              <Label>Track</Label>
              <Combobox
                value={track}
                onChange={setTrack}
                placeholder="No track"
                options={[
                  { value: "", label: "No track" },
                  ...TRACKS.map((t) => ({ value: t.name, label: t.name })),
                ]}
              />
            </div>

            <div>
              <Label>Speakers &amp; moderators</Label>
              <Combobox
                options={available.map((s) => ({ value: s.id, label: s.name }))}
                value={pickerValue}
                onChange={addParticipant}
                placeholder={
                  available.length ? "Add a speaker…" : "All speakers added"
                }
                searchPlaceholder="Search speakers…"
                disabled={available.length === 0}
              />

              {participants.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {participants.map((p) => (
                    <div
                      key={p.speakerId}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm font-medium">
                        {speakerName(p.speakerId)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Combobox
                          value={p.role}
                          onChange={(v) =>
                            setRole(p.speakerId, v as ParticipantRole)
                          }
                          options={[
                            { value: "speaker", label: "Speaker" },
                            { value: "moderator", label: "Moderator" },
                          ]}
                          size="sm"
                          className="w-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.speakerId)}
                          className="text-xs text-muted-foreground hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
