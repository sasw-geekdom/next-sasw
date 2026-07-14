import type { TopPage } from "@/lib/analytics/ga4";

export function Ga4TopPages({ pages }: { pages: TopPage[] | null }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          Top pages
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          GA4 · 28d
        </span>
      </div>

      <div className="mt-4 flex-1">
        {pages === null ? (
          <Setup />
        ) : pages.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No traffic yet. Data appears once the site is live.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pages.map((p) => {
              const max = Math.max(1, ...pages.map((x) => x.views));
              return (
                <li key={p.path} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-mono text-xs">{p.path}</span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {p.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-space-blue"
                      style={{ width: `${(p.views / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Setup() {
  return (
    <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Connect Google Analytics</p>
      <p className="mt-1">
        Set <code className="font-mono text-xs">GA4_PROPERTY_ID</code> and grant the
        service account Viewer access to see your top pages here.
      </p>
    </div>
  );
}
