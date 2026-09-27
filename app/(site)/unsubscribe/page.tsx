import type { Metadata } from "next";
import { verifyUnsubscribe } from "@/lib/email/unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * Where the footer link in a team email lands. It asks before it acts: the
 * button posts to /api/unsubscribe, because a link that unsubscribed on
 * arrival would be triggered by every mail scanner that follows links.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; t?: string; done?: string; invalid?: string }>;
}) {
  const { r = "", t = "", done, invalid } = await searchParams;
  const valid = verifyUnsubscribe(r, t);

  let title: string;
  let body: React.ReactNode;
  if (done) {
    title = "You're unsubscribed.";
    body = (
      <p>
        You won&rsquo;t get any more team updates from San Antonio Startup + Tech Week. Your registration still stands,
        and anything you need for a session you signed up for will still reach you.
      </p>
    );
  } else if (invalid || !valid) {
    title = "This link doesn't work.";
    body = (
      <p>
        It may have been copied incompletely. Use the Unsubscribe link at the bottom of the email itself, or reply to
        that email and we&rsquo;ll take you off the list.
      </p>
    );
  } else {
    title = "Unsubscribe from team updates?";
    body = (
      <>
        <p>
          You&rsquo;ll stop getting emails the San Antonio Startup + Tech Week team sends to everyone registered. Your
          registration stays as it is.
        </p>
        <form method="post" action={`/api/unsubscribe?r=${encodeURIComponent(r)}&t=${encodeURIComponent(t)}`}>
          <button
            type="submit"
            className="mt-8 inline-flex items-center rounded-md bg-magenta px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-magenta-ink"
          >
            Unsubscribe
          </button>
        </form>
      </>
    );
  }

  return (
    <main className="bg-black px-4 py-24 text-white sm:px-8">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">Email preferences</p>
        <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">{title}</h1>
        <div className="mt-6 space-y-4 text-lg text-white/75">{body}</div>
      </div>
    </main>
  );
}
