interface Point {
  iso: string;
  label: string;
  sessions: number;
}

/** Single-series sessions trend — area + line, space-blue. No legend (title names it). */
export function SessionsTrend({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <div className="h-16" />;
  }

  const W = 100;
  const H = 32;
  const max = Math.max(1, ...data.map((d) => d.sessions));
  const stepX = data.length > 1 ? W / (data.length - 1) : 0;

  const pts = data.map(
    (d, i) => [i * stepX, H - (d.sessions / max) * H] as const,
  );
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-16 w-full text-space-blue"
        role="img"
        aria-label={`Sessions per day, latest ${data[data.length - 1]?.sessions}`}
      >
        <path d={area} fill="currentColor" opacity={0.1} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
