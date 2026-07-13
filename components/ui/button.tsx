import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Magenta — the anchor CTA. "Plug in."
  primary:
    "bg-magenta text-white hover:bg-magenta/90 focus-visible:ring-magenta",
  // Space blue — secondary actions.
  secondary:
    "bg-space-blue text-white hover:bg-space-blue/90 focus-visible:ring-space-blue",
  outline:
    "border border-foreground/20 text-foreground hover:bg-muted focus-visible:ring-magenta",
  ghost: "text-foreground hover:bg-muted focus-visible:ring-magenta",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-7 text-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Verb-first CTA. Uppercase, tracked — reads like brand signage. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium uppercase tracking-wide",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
