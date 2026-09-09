"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The admin portal's control scale.
 *
 * The public site's primitives are sized for a marketing page — `Input` is
 * `h-11` with `text-base`, and `Button` at `md` matches it. That is right in
 * front of a visitor and wrong behind a login: the portal is a dense tool, and
 * dropping those controls into a toolbar left them towering over chrome that
 * was already compact. The topbar's own search is 34px at 14px with a 6px
 * radius; the sidebar's rows are 28px.
 *
 * So the portal gets its own scale, matched to the chrome it sits in rather
 * than to the site: 36px controls, 14px text, 6px radius. `Button` and
 * `Combobox` already have exactly this as their `sm` size, so those are used
 * directly — this file exists for `Input`, which has no small size, and to
 * name the scale in one place so the next admin table does not guess.
 *
 * Palette is unchanged and deliberate: white ground, near-black ink, magenta
 * reserved for focus and for the one thing on a screen that is active.
 */
export const ADMIN_CONTROL_H = "h-9";

export const AdminInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-1",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
AdminInput.displayName = "AdminInput";
