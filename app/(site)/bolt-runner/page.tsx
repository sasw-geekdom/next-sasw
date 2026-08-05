import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NotFoundGame } from "@/components/site/not-found-game";

// The hidden page behind the homepage bolt.
//
// A real route rather than a link into the 404. The game lives in a component,
// so both surfaces mount it — but the copy can't be shared: a page that
// congratulates you on finding it would be actively wrong for someone who
// mistyped a URL, and pointing an intentional link at a 404 also means serving
// a 404 status for a destination we meant people to reach.
//
// Inside the (site) group, so it carries the navbar and footer. That's the
// difference between this and the 404: an error page is a dead end reached by
// accident, and stripping the chrome tells you something broke. This is a
// destination someone earned — bare chrome would make the reward read as a
// fault. The navbar also carries the logo, so the page doesn't repeat it.

export const metadata: Metadata = {
  title: "Run the current",
  // Hidden by design — no sitemap entry either. Finding it should mean
  // clicking the bolt, not landing here from a search result.
  robots: { index: false, follow: false },
};

export default function BoltRunnerPage() {
  return (
    // Viewport minus the navbar rather than the full screen, so the game sits
    // centred in what's actually visible and the footer starts below the fold.
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 bg-black px-6 py-12 text-center text-white">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          Unlocked · hidden page
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
          You found the current.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
          The bolt keeps one page to itself. Run it as long as you like.
        </p>
      </div>

      <NotFoundGame />

      {/* One link, not two — the navbar logo and the footer both go home, so
          the old "Plug back in" would have been a third way to do the same
          thing. */}
      <Link
        href="/register"
        className="inline-flex items-center gap-0.5 text-sm font-medium text-magenta hover:underline"
      >
        Register
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </main>
  );
}
