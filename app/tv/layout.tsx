import type { Metadata } from "next";
import "./tv.css";

// The looping screens for the venues' TVs. Outside the (site) group on
// purpose: no navbar, no footer, nothing that scrolls — a TV browser opens
// the URL and the stage fills the screen.
//
// Unlisted rather than private. The AV crew types a URL into a TV and that is
// the whole setup, so there is no login to expire mid-afternoon. It is kept
// out of search (noindex here, and absent from the sitemap and the nav), and
// everything it shows is already public on the schedule.

export const metadata: Metadata = {
  title: "TV",
  robots: { index: false, follow: false },
};

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
