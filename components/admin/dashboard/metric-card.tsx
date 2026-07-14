import { ArrowDown, ArrowUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {Math.abs(delta).toFixed(0)}%
    </span>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-white p-3 lg:p-4">
      <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground lg:grid">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground lg:text-xs">
          {label}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-display text-xl font-bold tabular-nums lg:text-2xl">
            {value}
          </span>
          {delta !== undefined && <DeltaBadge delta={delta} />}
        </div>
        {sub && (
          <div className="mt-0.5 hidden font-mono text-xs text-muted-foreground lg:block">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
