import { SiteNavbar } from "@/components/site/site-navbar";
import { SiteFooter } from "@/components/site/site-footer";
import { NavWatcher } from "@/components/site/nav-watcher";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Records that the router has moved, so back controls know whether
          there is an in-app page behind them. Here rather than per-page so it
          survives navigation. */}
      <NavWatcher />
      <SiteNavbar />
      {children}
      <SiteFooter />
    </>
  );
}
