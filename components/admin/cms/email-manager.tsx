"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  sendTestEmail,
  type EmailActionResult,
} from "@/lib/admin/email-actions";

type Drafts = Record<EmailTemplateKey, EmailCopy>;

interface Props {
  initial: Drafts;
  updatedAt: number | null;
  updatedBy: string | null;
  adminEmail: string;
}

const FIELDS: {
  key: keyof EmailCopy;
  label: string;
  hint?: string;
  multiline?: boolean;
}[] = [
  { key: "subject", label: "Subject line" },
  { key: "heading", label: "Heading", hint: "The big line at the top of the message." },
  {
    key: "body",
    label: "Body",
    hint: "One paragraph per blank line.",
    multiline: true,
  },
  { key: "ctaIntro", label: "Calendar intro", hint: "Sits just above the “Add to calendar” buttons. Leave blank to omit." },
  { key: "signoff", label: "Sign-off", hint: "Closing line. Leave blank to omit." },
];

export function EmailManager({ initial, updatedAt, updatedBy, adminEmail }: Props) {
  const router = useRouter();
  const [active, setActive] = React.useState<EmailTemplateKey>("registration");
  const [drafts, setDrafts] = React.useState<Drafts>(initial);
  const [baseline, setBaseline] = React.useState<Drafts>(initial);
  const [issues, setIssues] = React.useState<Record<string, string[] | undefined>>({});
  const [notice, setNotice] = React.useState<
    { tone: "ok" | "error"; text: string } | null
  >(null);
  const [saving, startSave] = React.useTransition();
  const [testing, startTest] = React.useTransition();

  const meta = templateMeta(active);
  const draft = drafts[active];
  const preview = React.useMemo(() => renderSample(active, draft), [active, draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline[active]);

  function set(field: keyof EmailCopy, value: string) {
    setNotice(null);
    setIssues((prev) => ({ ...prev, [field]: undefined }));
    setDrafts((prev) => ({ ...prev, [active]: { ...prev[active], [field]: value } }));
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

  return (
    <div className="flex flex-col gap-5">
      {/* Template tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {EMAIL_TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTo(t.key)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active === t.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{meta.description}</p>

          {FIELDS.map((f) => {
            const err = issues[f.key]?.[0];
            return (
              <div key={f.key}>
                <Label htmlFor={`${active}-${f.key}`}>{f.label}</Label>
                {f.multiline ? (
                  <Textarea
                    id={`${active}-${f.key}`}
                    value={draft[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    rows={7}
                  />
                ) : (
                  <Input
                    id={`${active}-${f.key}`}
                    value={draft[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
                {(f.hint || err) && (
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      err ? "text-red-600" : "text-muted-foreground",
                    )}
                  >
                    {err ?? f.hint}
                  </p>
                )}
              </div>
            );
          })}

          {/* Token reference */}
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Placeholders:</span>{" "}
            {meta.tokens.map((tok) => (
              <code
                key={tok}
                className="mx-0.5 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-foreground"
              >
                {tok}
              </code>
            ))}{" "}
            fill in automatically when the email sends.
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

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onSave} disabled={saving || !dirty}>
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
            <Button variant="outline" onClick={onTest} disabled={testing}>
              {testing ? "Sending…" : "Send test to me"}
            </Button>
            <Button variant="ghost" onClick={onReset} disabled={saving}>
              Reset to default
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Test goes to <span className="font-medium">{adminEmail}</span>.
            {updatedAt && updatedBy ? (
              <>
                {" "}
                Last edited {formatDateTime(updatedAt)} by {updatedBy}.
              </>
            ) : null}
          </p>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Live preview
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Subject:</span>{" "}
              <span className="font-medium">{preview.subject}</span>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              sandbox=""
              className="h-[560px] w-full bg-[#f4f4f5]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
