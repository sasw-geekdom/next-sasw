"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import {
  EMAIL_TEMPLATES,
  renderSample,
  templateMeta,
  type EmailCopy,
  type EmailTemplateKey,
} from "@/lib/email/templates";
import {
  saveEmailCopy,
  sendKnowBeforeYouGoToAll,
  sendTestEmail,
  type EmailActionResult,
} from "@/lib/admin/email-actions";
import type { KnowBeforeYouGoStatus } from "@/lib/email/know-before-you-go";

type Drafts = Record<EmailTemplateKey, EmailCopy>;

// The two the team actually works in during the week, as tabs. The rest are
// automatic confirmations that are set once and left — a row of seven tabs
// made the two that matter hard to find, so those live in a dropdown.
const PRIMARY: EmailTemplateKey[] = ["registration", "knowBeforeYouGo"];

interface Props {
  initial: Drafts;
  updatedAt: number | null;
  updatedBy: string | null;
  adminEmail: string;
  knowBeforeYouGo: KnowBeforeYouGoStatus;
}

/**
 * The email editor.
 *
 * Laid out so the page reads in one pass: a toolbar with the picker and the
 * two actions, then the three fields anyone edits beside a preview big enough
 * to judge the email by. What used to sit in the column with the fields —
 * a hint under every input, a placeholders box on every template, the
 * calendar intro and sign-off nobody changes, three rows of actions and
 * footnotes — is either folded away or moved into the toolbar. The one action
 * that emails six hundred people gets a bar of its own above the editor
 * rather than a panel between Save and a footnote.
 */
export function EmailManager({
  initial,
  updatedAt,
  updatedBy,
  adminEmail,
  knowBeforeYouGo,
}: Props) {
  const router = useRouter();
  const [active, setActive] = React.useState<EmailTemplateKey>("registration");
  const [drafts, setDrafts] = React.useState<Drafts>(initial);
  const [baseline, setBaseline] = React.useState<Drafts>(initial);
  const [issues, setIssues] = React.useState<
    Record<string, string[] | undefined>
  >({});
  const [notice, setNotice] = React.useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [saving, startSave] = React.useTransition();
  const [testing, startTest] = React.useTransition();

  const meta = templateMeta(active);
  const draft = drafts[active];
  const preview = React.useMemo(
    () => renderSample(active, draft),
    [active, draft],
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline[active]);
  const isUnsaved = (k: EmailTemplateKey) =>
    JSON.stringify(drafts[k]) !== JSON.stringify(baseline[k]);
  const isCustomized = (k: EmailTemplateKey) =>
    JSON.stringify(baseline[k]) !== JSON.stringify(templateMeta(k).defaults);

  function set(field: keyof EmailCopy, value: string) {
    setNotice(null);
    setIssues((prev) => ({ ...prev, [field]: undefined }));
    setDrafts((prev) => ({
      ...prev,
      [active]: { ...prev[active], [field]: value },
    }));
  }

  function switchTo(key: EmailTemplateKey) {
    setNotice(null);
    setIssues({});
    setActive(key);
  }

  function handle(result: EmailActionResult) {
    if (result.ok) {
      setNotice({ tone: "ok", text: result.message });
      setIssues({});
      return true;
    }
    setNotice({ tone: "error", text: result.error });
    setIssues(result.issues ?? {});
    return false;
  }

  function onSave() {
    startSave(async () => {
      const res = await saveEmailCopy(active, draft);
      if (handle(res)) {
        setBaseline((prev) => ({ ...prev, [active]: draft }));
        router.refresh();
      }
    });
  }

  function onTest() {
    startTest(async () => {
      handle(await sendTestEmail(active, draft));
    });
  }

  function onReset() {
    setNotice(null);
    setIssues({});
    setDrafts((prev) => ({ ...prev, [active]: { ...meta.defaults } }));
  }

  const field = (
    key: keyof EmailCopy,
    label: string,
    opts: { multiline?: boolean; hint?: string } = {},
  ) => {
    const err = issues[key]?.[0];
    return (
      <div>
        <Label htmlFor={`${active}-${key}`}>{label}</Label>
        {opts.multiline ? (
          <Textarea
            id={`${active}-${key}`}
            value={draft[key]}
            onChange={(e) => set(key, e.target.value)}
            // Grows with the copy rather than scrolling inside itself — a
            // fixed box showed a slice of the body beside a preview of all
            // of it. `field-sizing` does it in Chrome and Safari; `rows` is
            // the floor everywhere else.
            rows={Math.min(40, Math.max(8, draft[key].split("\n").length + 2))}
            className="font-mono text-[13px] leading-relaxed [field-sizing:content]"
          />
        ) : (
          <Input
            id={`${active}-${key}`}
            value={draft[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        )}
        {(err || opts.hint) && (
          <p
            className={cn(
              "mt-1 text-xs",
              err ? "text-red-600" : "text-muted-foreground",
            )}
          >
            {err ?? opts.hint}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: which email, and the two things you do to it. Pinned,
          because the body grows to its full length now and Save is the thing
          you reach for at the bottom of it. It sticks to the top of the
          admin's <main>, which is the scroll container (see admin-shell), so
          it lands under the top bar rather than behind it. A sticky box stops
          at the inside of its scroller's padding, so `-top-5 sm:-top-6`
          cancels <main>'s py-5 / sm:py-6 — at top-0 a line of copy showed
          above it. The negative margins carry its ground across the sides. */}
      <div className="sticky -top-5 z-20 -mx-4 -mt-2 flex sm:-top-6 flex-wrap items-center justify-between gap-3 border-b border-border bg-white/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Email template"
            className="inline-flex gap-1 rounded-lg border border-border bg-muted/40 p-1"
          >
            {PRIMARY.map((key) => {
              const on = active === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => switchTo(key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                    on
                      ? "bg-foreground text-white shadow-sm"
                      : "text-muted-foreground hover:bg-white hover:text-foreground",
                  )}
                >
                  {templateMeta(key).label}
                  {isUnsaved(key) && (
                    <span
                      title="Unsaved changes"
                      className="h-1.5 w-1.5 rounded-full bg-magenta"
                    >
                      <span className="sr-only">(unsaved changes)</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Combobox
            value={PRIMARY.includes(active) ? "" : active}
            onChange={(v) => v && switchTo(v as EmailTemplateKey)}
            placeholder="Other emails…"
            size="sm"
            className="w-64"
            options={EMAIL_TEMPLATES.filter((t) => !PRIMARY.includes(t.key)).map(
              (t) => ({
                value: t.key,
                label: `${t.label}${isUnsaved(t.key) ? " (unsaved)" : isCustomized(t.key) ? " (edited)" : ""}`,
              }),
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          {updatedAt && updatedBy && (
            <span className="hidden text-xs text-muted-foreground md:inline">
              Last saved {formatDateTime(updatedAt)} by {updatedBy}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={testing}
            title={`Sends this draft to ${adminEmail}`}
          >
            {testing ? "Sending…" : "Send test"}
          </Button>
          {/* Quiet when there is nothing to save. The disabled primary was a
              washed-out pink block that read as broken, beside a "Saved"
              label saying the same thing. */}
          {dirty || saving ? (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled>
              Saved
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <p
          className={cn(
            "text-sm font-medium",
            notice.tone === "ok" ? "text-green-700" : "text-red-600",
          )}
        >
          {notice.text}
        </p>
      )}

      {active === "knowBeforeYouGo" && (
        <SendBar status={knowBeforeYouGo} dirty={dirty} />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Editor */}
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{meta.description}</p>

          {field("subject", "Subject line")}
          {field("heading", "Heading")}
          {field("body", "Body", { multiline: true })}

          <Disclosure title="Formatting">
            <FormattingHelp tokens={meta.tokens} />
          </Disclosure>

          <Disclosure title="More options">
            <div className="flex flex-col gap-4">
              {field("ctaIntro", "Calendar intro", {
                hint: "The line above the Add to calendar buttons. Leave blank to drop the buttons.",
              })}
              {field("signoff", "Sign-off", {
                hint: "The closing line. Leave blank to omit.",
              })}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  disabled={saving}
                >
                  Reset to default copy
                </Button>
              </div>
            </div>
          </Disclosure>
        </div>

        {/* Preview — the email as it will arrive, at a height that shows
            most of it rather than a window onto the top third. */}
        <div className="lg:sticky lg:top-16 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-baseline gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-sm">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Preview
              </span>
              <span className="truncate font-medium">{preview.subject}</span>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              sandbox=""
              className="h-[calc(100dvh-12rem)] min-h-120 w-full bg-[#f4f4f5]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A closed-by-default section under the fields. */
function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden
          className="text-muted-foreground transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div className="border-t border-border px-3.5 py-3.5">{children}</div>
    </details>
  );
}

/** What the body understands, and the placeholders that fill in on send. */
function FormattingHelp({ tokens }: { tokens: string[] }) {
  const rows: [string, string][] = [
    ["## Badge pickup", "Section heading"],
    ["The Rand | 110 E Houston St", "A row in a boxed list — one per line"],
    ["> Nothing to print.", "Highlighted tip"],
    ["[See the schedule](https://…)", "Button — one per line"],
  ];
  return (
    <div className="flex flex-col gap-3 text-xs text-muted-foreground">
      <p>
        One block per blank line. Web addresses become links on their own.
      </p>
      <table className="w-full">
        <tbody>
          {rows.map(([code, what]) => (
            <tr key={code} className="align-top">
              <td className="py-1 pr-3">
                <code className="whitespace-nowrap rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  {code}
                </code>
              </td>
              <td className="py-1">{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        {tokens.map((t) => (
          <code
            key={t}
            className="mr-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
          >
            {t}
          </code>
        ))}
        fills in for each person when the email sends.
      </p>
    </div>
  );
}

/**
 * The one action on this page that emails more than one person.
 *
 * A bar of its own, above the editor, so it is neither missed nor mistaken
 * for part of editing. Two presses, and the second names the number: the count
 * goes with the action, which refuses if the list moved since the page loaded
 * — "Send to 602" can only ever send to 602. Held while the editor has unsaved
 * changes, because the saved copy is what goes.
 */
function SendBar({
  status,
  dirty,
}: {
  status: KnowBeforeYouGoStatus;
  dirty: boolean;
}) {
  const router = useRouter();
  const [armed, setArmed] = React.useState(false);
  const [sending, startSend] = React.useTransition();
  const [result, setResult] = React.useState<EmailActionResult | null>(null);
  const { total, sent, pending, lastRun } = status;
  const noun = (n: number) => `${n} registrant${n === 1 ? "" : "s"}`;

  function onSend() {
    startSend(async () => {
      const res = await sendKnowBeforeYouGoToAll(pending);
      setResult(res);
      setArmed(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Send to registrants
          </span>
          <span className="text-sm">
            <span className="font-semibold">{pending}</span>{" "}
            <span className="text-muted-foreground">
              waiting · {sent} sent · {total} registered
            </span>
          </span>
        </div>

        {dirty ? (
          <span className="text-sm font-medium text-magenta">
            Save first — the saved copy is what sends.
          </span>
        ) : pending === 0 ? (
          <span className="text-sm font-medium">Everyone registered has it.</span>
        ) : armed ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setArmed(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={onSend} disabled={sending}>
              {sending ? "Sending…" : `Yes, send to ${noun(pending)}`}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null);
              setArmed(true);
            }}
          >
            Send to {noun(pending)}…
          </Button>
        )}
      </div>

      {result ? (
        <p
          className={cn(
            "text-sm font-medium",
            result.ok ? "text-green-700" : "text-red-600",
          )}
        >
          {result.ok ? result.message : result.error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only reaches people who have not had it — send again later to cover
          anyone who registers since.
          {lastRun && (
            <>
              {" "}
              Last sent {formatDateTime(lastRun.at)} by {lastRun.by}, to{" "}
              {noun(lastRun.sent)}
              {lastRun.failed
                ? `; ${lastRun.failed} not sent (${lastRun.error})`
                : ""}
              .
            </>
          )}
        </p>
      )}
    </div>
  );
}
