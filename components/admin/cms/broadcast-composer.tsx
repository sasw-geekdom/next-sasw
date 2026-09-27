"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { EMPTY_BROADCAST, broadcastEmail, type BroadcastContent } from "@/lib/email/templates";
import {
  deleteBroadcast,
  saveBroadcast,
  sendBroadcastTest,
  sendBroadcastToAll,
  type BroadcastActionResult,
} from "@/lib/admin/broadcast-actions";
import type { BroadcastList, BroadcastRow } from "@/lib/email/broadcasts";

const pick = (r: BroadcastContent): BroadcastContent => ({
  subject: r.subject,
  preheader: r.preheader,
  heading: r.heading,
  body: r.body,
});

/**
 * Team emails to every registrant: write, preview, test, send.
 *
 * The branding is fixed — the team writes the subject, a preview line, an
 * optional heading and the body, in the same light formatting the other
 * templates use. The order of operations is enforced rather than suggested:
 * the saved version is what goes, it goes only after its author (or anyone)
 * has sent it to themselves as a test, and the send names its number.
 * Once an email has gone out it can't be edited or deleted — it stays in the
 * list as the record of what was sent.
 */
export function BroadcastComposer({ list, adminEmail }: { list: BroadcastList; adminEmail: string }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(list.rows[0]?.id ?? null);
  const row = list.rows.find((r) => r.id === selected) ?? null;
  const [draft, setDraft] = React.useState<BroadcastContent>(row ? pick(row) : EMPTY_BROADCAST);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, startBusy] = React.useTransition();

  const baseline = row ? pick(row) : EMPTY_BROADCAST;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const locked = Boolean(row && row.sent > 0);
  const tested = Boolean(row && !dirty && row.testedHash === row.savedHash);

  const preview = React.useMemo(
    () => broadcastEmail(draft, { name: "Alex Rivera" }, "#unsubscribe"),
    [draft],
  );

  function open(id: string | null) {
    const next = list.rows.find((r) => r.id === id);
    setSelected(id);
    setDraft(next ? pick(next) : EMPTY_BROADCAST);
    setIssues({});
    setNotice(null);
  }

  function handle(res: BroadcastActionResult) {
    setNotice(res.ok ? { tone: "ok", text: res.message } : { tone: "error", text: res.error });
    setIssues(res.ok ? {} : (res.issues ?? {}));
    return res.ok;
  }

  function set(field: keyof BroadcastContent, value: string) {
    setNotice(null);
    setIssues((p) => ({ ...p, [field]: undefined }));
    setDraft((d) => ({ ...d, [field]: value }));
  }

  const onSave = () =>
    startBusy(async () => {
      const res = await saveBroadcast(selected, draft);
      if (handle(res) && res.ok && res.id) {
        setSelected(res.id);
        router.refresh();
      }
    });

  const onTest = () =>
    startBusy(async () => {
      if (!selected) return;
      handle(await sendBroadcastTest(selected));
      router.refresh();
    });

  const onDelete = () =>
    startBusy(async () => {
      if (!selected) return;
      if (handle(await deleteBroadcast(selected))) {
        open(null);
        router.refresh();
      }
    });

  const field = (key: keyof BroadcastContent, label: string, hint?: string, multiline = false) => {
    const err = issues[key]?.[0];
    return (
      <div>
        <Label htmlFor={`bc-${key}`}>{label}</Label>
        {multiline ? (
          <Textarea
            id={`bc-${key}`}
            value={draft[key]}
            disabled={locked}
            onChange={(e) => set(key, e.target.value)}
            rows={Math.min(40, Math.max(10, draft[key].split("\n").length + 2))}
            className="font-mono text-[13px] leading-relaxed [field-sizing:content]"
          />
        ) : (
          <Input id={`bc-${key}`} value={draft[key]} disabled={locked} onChange={(e) => set(key, e.target.value)} />
        )}
        {(err || hint) && (
          <p className={cn("mt-1 text-xs", err ? "text-red-600" : "text-muted-foreground")}>{err ?? hint}</p>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
      {/* The emails: drafts and the log of what went out. */}
      <aside className="flex flex-col gap-2">
        <Button size="sm" variant={selected === null ? "primary" : "outline"} onClick={() => open(null)}>
          New email
        </Button>
        <ul className="flex flex-col gap-1">
          {list.rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => open(r.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  r.id === selected ? "bg-foreground text-white" : "hover:bg-muted",
                )}
              >
                <span className="block truncate font-medium">{r.subject || "Untitled"}</span>
                <span className={cn("block text-xs", r.id === selected ? "text-white/70" : "text-muted-foreground")}>
                  {r.sent > 0 ? `Sent to ${r.sent}` : "Draft"}
                  {r.updatedAt ? ` · ${formatDateTime(r.updatedAt)}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {list.reachable} registrants can be emailed
          {list.unsubscribed ? ` · ${list.unsubscribed} unsubscribed` : ""}.
        </p>
      </aside>

      <div className="flex flex-col gap-4">
        {/* Keyed by email, so switching emails starts the panel fresh. */}
        <SendPanel
          key={row?.id ?? "new"}
          row={row}
          dirty={dirty}
          tested={tested}
          busy={busy}
          adminEmail={adminEmail}
          onSave={onSave}
          onTest={onTest}
          onDelete={onDelete}
          notice={notice}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex flex-col gap-4">
            {locked ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                This email has gone out, so it&rsquo;s read-only. Start a new email to send something else.
              </p>
            ) : null}
            {field("subject", "Subject line")}
            {field("preheader", "Preview text", "The grey line inboxes show after the subject. Optional.")}
            {field("heading", "Heading", "The big line at the top. Optional.")}
            {field("body", "Message", undefined, true)}
            <details className="group rounded-lg border border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                Formatting
                <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <div className="flex flex-col gap-2 border-t border-border px-3.5 py-3.5 text-xs text-muted-foreground">
                <p>One block per blank line. Web addresses become links on their own.</p>
                {[
                  ["## Badge pickup", "Section heading"],
                  ["The Rand | 110 E Houston St", "A row in a boxed list — one per line"],
                  ["> Nothing to print.", "Highlighted tip"],
                  ["[See the schedule](https://…)", "Button — one per line"],
                  ["{firstName}", "Each person's first name"],
                ].map(([code, what]) => (
                  <p key={code}>
                    <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                      {code}
                    </code>
                    {what}
                  </p>
                ))}
                <p>The logo, colours, footer and unsubscribe link are added automatically.</p>
              </div>
            </details>
          </div>

          <div className="lg:sticky lg:top-16 lg:self-start">
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-baseline gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-sm">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Preview</span>
                <span className="truncate font-medium">{preview.subject || "No subject yet"}</span>
              </div>
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                sandbox=""
                className="h-[calc(100dvh-14rem)] min-h-120 w-full bg-[#f4f4f5]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Save → test → send, in that order, with the step you're on as the button
 * that's lit. The send is two presses and the second names the number; the
 * action refuses if the list moved since the page loaded.
 */
function SendPanel({
  row,
  dirty,
  tested,
  busy,
  adminEmail,
  onSave,
  onTest,
  onDelete,
  notice,
}: {
  row: BroadcastRow | null;
  dirty: boolean;
  tested: boolean;
  busy: boolean;
  adminEmail: string;
  onSave: () => void;
  onTest: () => void;
  onDelete: () => void;
  notice: { tone: "ok" | "error"; text: string } | null;
}) {
  const router = useRouter();
  const [armed, setArmed] = React.useState(false);
  const [sending, startSend] = React.useTransition();
  const [result, setResult] = React.useState<BroadcastActionResult | null>(null);
  const noun = (n: number) => `${n} registrant${n === 1 ? "" : "s"}`;
  const pending = row?.pending ?? 0;
  const locked = Boolean(row && row.sent > 0);

  const onSend = () =>
    startSend(async () => {
      if (!row) return;
      const res = await sendBroadcastToAll(row.id, pending);
      setResult(res);
      setArmed(false);
      router.refresh();
    });

  const step = !row || dirty ? "save" : !tested ? "test" : "send";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest">
          {(["save", "test", "send"] as const).map((s, i) => (
            <li key={s} className={cn(step === s ? "text-foreground" : "text-muted-foreground/60")}>
              {i + 1}. {s === "save" ? "Save" : s === "test" ? "Send yourself a test" : "Send to everyone"}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-2">
          {row && !locked ? (
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={busy || sending}>
              Delete draft
            </Button>
          ) : null}
          {!locked ? (
            <Button size="sm" variant={step === "save" ? "primary" : "outline"} onClick={onSave} disabled={busy || !dirty}>
              {dirty || !row ? "Save draft" : "Saved"}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={step === "test" ? "primary" : "outline"}
            onClick={onTest}
            disabled={busy || !row || dirty}
            title={`Sends the saved version to ${adminEmail}`}
          >
            Send test
          </Button>
          {step === "send" && pending > 0 ? (
            armed ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setArmed(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onSend} disabled={sending}>
                  {sending ? "Sending…" : `Yes, send to ${noun(pending)}`}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => (setResult(null), setArmed(true))}>
                {locked ? `Send to ${noun(pending)} who haven’t had it…` : `Send to ${noun(pending)}…`}
              </Button>
            )
          ) : null}
        </div>
      </div>

      {result ? (
        <p className={cn("text-sm font-medium", result.ok ? "text-green-700" : "text-red-600")}>
          {result.ok ? result.message : result.error}
        </p>
      ) : notice ? (
        <p className={cn("text-sm font-medium", notice.tone === "ok" ? "text-green-700" : "text-red-600")}>
          {notice.text}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {step === "save" && "The saved version is what sends. Save to continue."}
          {step === "test" && `Send the saved version to ${adminEmail} and check it before it goes to everyone.`}
          {step === "send" &&
            (pending === 0
              ? "Everyone who can be emailed has had this one."
              : `Tested${row?.testedBy ? ` by ${row.testedBy}` : ""}. Goes to everyone registered who hasn’t unsubscribed.`)}
          {row?.lastRun && (
            <>
              {" "}
              Last sent {formatDateTime(row.lastRun.at)} by {row.lastRun.by}, to {noun(row.lastRun.sent)}
              {row.lastRun.failed ? `; ${row.lastRun.failed} not sent (${row.lastRun.error})` : ""}.
            </>
          )}
        </p>
      )}
    </div>
  );
}
