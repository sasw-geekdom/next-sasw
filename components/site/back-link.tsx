"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cameFromInsideTheApp } from "@/lib/nav-history";

/**
 * A back control that returns you to where you were, not to the top of a page
 * you may never have been on.
 *
 * Going back through the router rather than navigating to `href` is what
 * restores the scroll position: the browser holds it against the history
 * entry, and Next puts it back on a pop. Linking to /sessions instead always
 * lands at the top of the schedule, even for someone who reached the page
 * from a venue's list halfway down.
 *
 * Label it generically. This used to read "The full schedule", which was true
 * only when /sessions was where you came from — arriving from a venue's own
 * list, the control said "the full schedule" and returned you to the venue
 * page. The alternative was setting the label from the actual destination,
 * which can only be known after mount and so would visibly flash.
 *
 * `href` is not decoration. It stays on the anchor so the control is a real
 * link — crawlable, openable in a new tab, and working without JavaScript —
 * and it is the destination whenever going back would leave the site.
 */
export function BackLink({
  href,
  className,
  children,
}: {
  /** Where to go when there is no in-app history to return to. */
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        // Cmd/ctrl/shift-click and middle-click mean "open elsewhere". Calling
        // back() there would both hijack the gesture and move this tab.
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        // Someone who arrived from a shared link or a search result has no
        // in-app page behind them — back() would push them off the site
        // entirely. They follow the href instead.
        if (!cameFromInsideTheApp()) return;

        e.preventDefault();
        router.back();
      }}
    >
      {children}
    </Link>
  );
}
