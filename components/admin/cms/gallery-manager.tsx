"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncGallery } from "@/lib/admin/gallery-actions";
import type { SyncResult } from "@/lib/gallery-sync";

export function GalleryManager({
  count,
  thumbs,
}: {
  count: number;
  thumbs: { name: string; url: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [notice, setNotice] = React.useState<
    { tone: "ok" | "error"; text: string } | null
  >(null);

  function summarize(r: SyncResult): string {
    const parts = [`${r.generated} built`];
    if (r.skipped) parts.push(`${r.skipped} unchanged`);
    if (r.removed) parts.push(`${r.removed} removed`);
    const base = `${parts.join(", ")}. ${r.total} photos live.`;
    return r.remaining > 0
      ? `${base} ${r.remaining} still to go — run sync again.`
      : base;
  }

  function onSync() {
    setNotice(null);
    startTransition(async () => {
      const res = await syncGallery();
      if (res.ok) {
        setNotice({ tone: "ok", text: summarize(res.result) });
        router.refresh();
      } else {
        setNotice({ tone: "error", text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-4xl font-bold tabular-nums">
            {count}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            thumbnails published to the wall
          </div>
        </div>
        <Button onClick={onSync} disabled={pending} className="gap-2">
          <RefreshCw
            className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            strokeWidth={2}
          />
          {pending ? "Syncing…" : "Sync photos"}
        </Button>
      </div>

      {notice && (
        <p
          className={
            notice.tone === "ok"
              ? "text-sm font-medium text-green-700"
              : "text-sm font-medium text-red-600"
          }
        >
          {notice.text}
        </p>
      )}

      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          Upload originals to the{" "}
          <code className="font-mono text-xs">15-years/</code> folder in Firebase
          Storage (JPG, PNG, WebP, or HEIC).
        </li>
        <li>
          Click <span className="font-medium text-foreground">Sync photos</span>{" "}
          — thumbnails are resized, optimized, and published automatically.
        </li>
        <li>Deleted originals drop off the wall on the next sync.</li>
      </ol>

      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {thumbs.slice(0, 24).map((t) => (
            <div
              key={t.name}
              className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              <Image
                src={t.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
