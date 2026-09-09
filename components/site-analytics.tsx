"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

// The `window.gtag` declaration lives with the conversion helpers.
import "@/lib/analytics/track";

/**
 * A `page_view` per client-side navigation, which is the one GA was not
 * sending.
 *
 * `<GoogleAnalytics>` injects gtag and fires `gtag('config', id)`, and that
 * config sends exactly one `page_view` — for the document that loaded. Every
 * move after it is an App Router soft navigation with no document load, so GA
 * only saw it if Enhanced Measurement's history listener happened to catch it.
 * On this site it mostly did not, and the numbers show the shape of that: GA
 * recorded 70% of Vercel's visitors but only 40% of its page views, 2.26 views
 * per user against 3.89. Blocking suppresses both together; this only
 * suppressed the second, which is the signature of missing in-app navigation.
 *
 * The first render is skipped deliberately — `config` already counted it, and
 * sending our own would double every landing.
 *
 * If GA4's "page changes based on browser history events" is switched on under
 * Enhanced Measurement, turn it off: with both running, soft navigations count
 * twice. The 40% above is good evidence it is not currently firing, but it is
 * a property setting rather than something this file can see, so it is worth a
 * look at Realtime after this deploys.
 */
function GaRouteViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window.gtag !== "function") return;
    const qs = search.toString();
    window.gtag("event", "page_view", {
      page_path: qs ? `${pathname}?${qs}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}

/**
 * Both analytics, and neither of them behind the login.
 *
 * `/admin` was being measured as if it were the public site — the dashboard's
 * own Top Pages list had `/admin` at 194 views, which is the team watching
 * itself work during a build week. Nothing under `/admin` is public and no
 * decision is made from its traffic, so it does not belong in either tool.
 *
 * Rendering nothing there also stops the route-change tracker from reporting
 * the admin's own navigation, which is the larger share of it.
 */
export function SiteAnalytics({ gaId }: { gaId?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <Analytics />
      {gaId && (
        <>
          <GoogleAnalytics gaId={gaId} />
          {/* `useSearchParams` needs a boundary or it opts every page into
              client rendering. */}
          <React.Suspense fallback={null}>
            <GaRouteViews />
          </React.Suspense>
        </>
      )}
    </>
  );
}
