export function StatTile({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string | number;
  footnote?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tabular-nums">
        {value}
      </div>
      {footnote && (
        <div className="mt-0.5 font-mono text-xs text-muted-foreground">
          {footnote}
        </div>
      )}
    </div>
  );
}
