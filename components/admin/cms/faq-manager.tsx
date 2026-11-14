"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer } from "@/components/ui/drawer";
import { useDragReorder } from "@/lib/admin/use-drag-reorder";
import { cn } from "@/lib/utils";
import type { SaveResult } from "@/lib/admin/cms-actions";
import type { FaqRow, FaqSectionId } from "@/lib/admin/cms-types";

/** A section as the admin shows it: the public page's own eyebrow and headline. */
export interface FaqSectionMeta {
  id: FaqSectionId;
  eyebrow: string;
  headline: string;
}

interface Props {
  rows: FaqRow[];
  sections: FaqSectionMeta[];
  /** How many questions the built-in FAQ has — what an import would bring in. */
  builtInCount: number;
  saveAction: (form: FormData) => Promise<SaveResult>;
  deleteAction: (id: string) => Promise<SaveResult>;
  reorderAction: (ids: string[]) => Promise<SaveResult>;
  importAction: () => Promise<SaveResult>;
}

/**
 * The /faq questions, editable without a developer.
 *
 * Grouped by the page's three sections, in the order the page shows them.
 * The sections themselves stay fixed — two carry their own widgets on /faq,
 * the badge desks and the parking map — so what's managed here is the
 * questions: add, edit, move between sections, reorder within one, delete.
 *
 * Until the CMS holds any questions the public page shows the answers built
 * into the site, and this page offers to import them as the starting point.
 */
export function FaqManager({
  rows,
  sections,
  builtInCount,
  saveAction,
  deleteAction,
  reorderAction,
  importAction,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<FaqRow | { section: FaqSectionId } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>({});

  function open(row: FaqRow | { section: FaqSectionId }) {
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

  function onDelete(row: FaqRow) {
    if (!confirm(`Delete "${row.q}"?`)) return;
    startTransition(async () => {
      await deleteAction(row.id);
      setEditing(null);
      router.refresh();
    });
  }

  function onImport() {
    setError(null);
    startTransition(async () => {
      const res = await importAction();
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-dashed border-border p-8">
        <p className="max-w-xl text-sm text-muted-foreground">
          The FAQ page is showing the {builtInCount} answers built into the site. Import them to
          edit them here — the public page won&apos;t change until you save an edit.
        </p>
        <div>
          <Button onClick={onImport} disabled={pending}>
            {pending ? "Importing…" : "Import the current FAQ"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const current = editing && "id" in editing ? editing : null;

  return (
    <div className="flex flex-col gap-8">
      <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        Drag questions to reorder them within a section — the public page follows it.
      </p>

      {sections.map((section) => (
        <SectionList
          key={section.id}
          section={section}
          rows={rows.filter((r) => r.section === section.id)}
          onAdd={() => open({ section: section.id })}
          onEdit={open}
          onDelete={onDelete}
          onReorder={(ids) =>
            startTransition(async () => {
              await reorderAction(ids);
              router.refresh();
            })
          }
        />
      ))}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? "Edit question" : "Add question"}
      >
        {editing !== null && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            {current && <input type="hidden" name="id" value={current.id} />}

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Section</legend>
              <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-checked:border-magenta has-checked:bg-magenta/5"
                  >
                    <input
                      type="radio"
                      name="section"
                      value={s.id}
                      defaultChecked={editing.section === s.id}
                      className="accent-magenta"
                    />
                    {s.eyebrow}
                  </label>
                ))}
              </div>
              {issues.section?.[0] && <FieldError>{issues.section[0]}</FieldError>}
            </fieldset>

            <div>
              <Label htmlFor="q">Question</Label>
              <Input id="q" name="q" defaultValue={current?.q} required />
              {issues.q?.[0] && <FieldError>{issues.q[0]}</FieldError>}
            </div>

            <div>
              <Label htmlFor="a">Answer</Label>
              <Textarea id="a" name="a" rows={8} defaultValue={current?.a.join("\n\n")} required />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave a blank line between paragraphs. Plain text — Google reads these answers too.
              </p>
              {issues.a?.[0] && <FieldError>{issues.a[0]}</FieldError>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="linkLabel">Link label (optional)</Label>
                <Input id="linkLabel" name="linkLabel" placeholder="The schedule" defaultValue={current?.link?.label} />
                {issues.linkLabel?.[0] && <FieldError>{issues.linkLabel[0]}</FieldError>}
              </div>
              <div>
                <Label htmlFor="linkHref">Link address</Label>
                <Input id="linkHref" name="linkHref" placeholder="/schedule" defaultValue={current?.link?.href} />
                {issues.linkHref?.[0] && <FieldError>{issues.linkHref[0]}</FieldError>}
              </div>
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

/** One section's questions, drag-ordered within the section. */
function SectionList({
  section,
  rows,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  section: FaqSectionMeta;
  rows: FaqRow[];
  onAdd: () => void;
  onEdit: (row: FaqRow) => void;
  onDelete: (row: FaqRow) => void;
  onReorder: (ids: string[]) => void;
}) {
  const { items, draggingId, dragProps } = useDragReorder(rows, onReorder);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-magenta-ink">{section.eyebrow}</p>
          <h2 className="font-display text-xl font-bold uppercase">{section.headline}</h2>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          Add question
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          No questions in this section.
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((row, i) => (
            <li
              key={row.id}
              {...dragProps(i)}
              className={cn(
                "flex cursor-grab items-start gap-3 rounded-lg border border-border bg-white p-4 active:cursor-grabbing",
                draggingId === row.id && "border-magenta opacity-60",
              )}
            >
              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{row.q}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.a.join(" ")}</p>
                {row.link && (
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-magenta-ink">
                    {row.link.label} → {row.link.href}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
