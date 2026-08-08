"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { markInternalNav } from "@/lib/nav-history";

/**
 * Records that the router has moved, so back controls know whether there is
 * an in-app page behind them. Renders nothing; lives in the site layout so it
 * stays mounted across navigations.
 *
 * The first run is skipped deliberately — that one fires on the initial mount
 * of whatever page was loaded directly, which is not a navigation.
 */
export function NavWatcher() {
  const pathname = usePathname();
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    markInternalNav();
  }, [pathname]);

  return null;
}
