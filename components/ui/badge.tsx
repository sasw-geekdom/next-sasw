import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "magenta" | "blue" | "neutral" | "success" | "danger";

const tones: Record<Tone, string> = {
  magenta: "bg-magenta/10 text-magenta",
  blue: "bg-space-blue/10 text-space-blue",
  neutral: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
