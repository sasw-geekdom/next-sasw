import Link from "next/link";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/admin/content"
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Content
      </Link>
      <h1 className="font-display text-heading font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
