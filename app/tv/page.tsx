import Link from "next/link";
import { TV_DAYS, tvGroups } from "@/lib/tv";

// The AV crew's page: every screen, one tap each. Plain on purpose — it is
// opened once per TV, on a remote or a phone, and has to be obvious at a
// glance rather than on brand.

export const revalidate = 300;

const EVENTS = [
  { slug: "the-model", title: "The Model", when: "Monday · 1 – 6 PM" },
  { slug: "access-granted", title: "Access Granted", when: "Wednesday · 1 – 6 PM" },
  { slug: "pysanantonio", title: "PySanAntonio", when: "Friday · 1 – 6 PM" },
];

function Row({ href, title, when }: { href: string; title: string; when: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-baseline justify-between gap-6 border-t border-white/10 py-4 transition-colors hover:bg-white/5"
      >
        <span className="text-lg font-medium text-white">{title}</span>
        <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-white/50">
          {when} · <span className="text-magenta">{href}</span>
        </span>
      </Link>
    </li>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-mono text-xs uppercase tracking-widest text-white/55">
        <span className="text-magenta">{"//"}</span> {label}
      </h2>
      <ul className="mt-3">{children}</ul>
    </section>
  );
}

export default async function TvIndex() {
  const groups = await tvGroups().catch(() => []);
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">SASTW · TV loops</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase sm:text-5xl">
          Screens for the rooms
        </h1>
        <div className="mt-6 space-y-2 text-white/70">
          <p>Open a loop in the TV&rsquo;s browser. It plays on its own and follows the clock.</p>
          <p>Double-click to go fullscreen. The cursor hides once the mouse stops moving.</p>
          <p>
            Sessions edited in the admin reach the screen within five minutes. You don&rsquo;t need
            to reload.
          </p>
          <p>
            To rehearse a time, add{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">?at=2026-09-29T13:20</code>{" "}
            (Central time) to any loop.
          </p>
        </div>

        <Section label="The week">
          <Row href="/tv/week" title="Startup + Tech Week" when="All week" />
        </Section>
        <Section label="Events at Geekdom">
          {EVENTS.map((e) => (
            <Row key={e.slug} href={`/tv/${e.slug}`} title={e.title} when={e.when} />
          ))}
        </Section>
        <Section label="Community days at Geekdom">
          {Object.keys(TV_DAYS).map((d) => (
            <Row
              key={d}
              href={`/tv/${d}`}
              title={`${d[0].toUpperCase()}${d.slice(1)} at Geekdom`}
              when="Every group, following the clock"
            />
          ))}
        </Section>
        {groups.length ? (
          <Section label="One group">
            {groups.map((g) => (
              <Row key={g.slug} href={`/tv/${g.slug}`} title={g.title} when={`${g.dayWord} · ${g.timeLabel}`} />
            ))}
          </Section>
        ) : null}
      </div>
    </main>
  );
}
