"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A number, what it counts, and — where it filters — a control.
 *
 * The brand's own device at the portal's scale: the figure in the display face,
 * Oswald, the same one the site sets a headline in, over a small uppercase
 * label. That is what keeps the admin recognisably this event's rather than a
 * generic console.
 *
 * Three shapes, one card. With `onClick` it is a button — that is the
 * registrations strip, where pressing a card filters the table under it. With
 * `href` it is a link, which is what the same numbers want on the dashboard:
 * there is no table there to filter, so "57 new this week" should take you to
 * the 57. With neither it is a plain div.
 *
 * The pressed state is the house black rather than a border tint, because on
 * the registrations page this row is the only filter surface and which card is
 * on has to be readable from across the desk.
 */
export function StatCard({
  label,
  value,
  pressed,
  onClick,
  href,
  className,
}: {
  label: string;
  value: number | string;
  pressed?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <div
        className={cn(
          "font-display text-2xl font-bold tabular-nums",
          pressed && "text-white",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-0.5 text-xs uppercase tracking-wide",
          pressed ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {label}
      </div>
    </>
  );

  const shell = cn(
    "rounded-lg border px-4 py-3 text-left transition-colors",
    pressed ? "border-foreground bg-foreground" : "border-border bg-white",
    className,
  );

  const interactive =
    "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-1";

  if (href) {
    return (
      <Link href={href} className={cn(shell, interactive)}>
        {body}
      </Link>
    );
  }

  if (!onClick) return <div className={shell}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(shell, !pressed && interactive)}
    >
      {body}
    </button>
  );
}
