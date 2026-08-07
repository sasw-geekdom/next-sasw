import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SessionBento, type SessionCard } from "@/components/site/session-bento";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import { listPartners } from "@/lib/admin/cms-queries";
import { resolveSchedule, scheduleSlugs } from "@/lib/sessions";
import { cn } from "@/lib/utils";

// A venue's own week. /sessions is the whole grid; this is one room's slice of
// it, which is what room-flow's per-venue CTA promises.
//
// Static at build time from scheduleSlugs(), revalidated on the same cycle as
// /sessions so a CMS-driven partner logo lands here at the same moment.
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return scheduleSlugs().map((slug) => ({ slug }));
}

async function safeList<T>(p: Promise<T[]>): Promise<T[]> {
  try {
    return await p;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const schedule = resolveSchedule(slug);
  if (!schedule) return {};

  const { room } = schedule;
  const description = `${room.desc} ${room.name} during San Antonio Startup + Tech Week, Sept 28 – Oct 2, 2026.`;
  return {
    title: room.name,
    description,
    alternates: { canonical: `/sessions/${room.slug}` },
    openGraph: {
      title: `${room.name} · SASTW 2026`,
      description,
      url: `/sessions/${room.slug}`,
    },
    twitter: { title: `${room.name} · SASTW 2026`, description },
  };
}

export default async function VenueSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const schedule = resolveSchedule(slug);
  if (!schedule) notFound();

  const { room, sessions } = schedule;
  const partners = await safeList(listPartners());

  // Same lockup resolution as /sessions — a session that borrows a partner's
  // mark tracks whatever the admin has uploaded rather than a file in the repo.
  const cards: SessionCard[] = sessions.map((s) => {
    if (s.logo) return { ...s, logoSrc: s.logo.src, logoAlt: s.logo.alt };
    if (s.logoFromPartner) {
      const needle = s.logoFromPartner.toLowerCase();
      const match = partners.find((p) =>
        p.name.toLowerCase().includes(needle),
      );
      if (match?.imageUrl) {
        return { ...s, logoSrc: match.imageUrl, logoAlt: match.name };
      }
    }
    return s;
  });

  return (
    <main>
      {/* The venue's own masthead — the same portrait-and-panel grammar as
          room-flow's rows, so arriving here reads as stepping into the row you
          clicked rather than landing somewhere unrelated. */}
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20">
          {/* Same back link as /speakers/[slug], down to the charge landing on
              the arrow rather than the whole control: the label lifts a step in
              brightness, the arrow is the only thing that takes colour. */}
          <Link
            href="/sessions"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none"
          >
            <ArrowLeft
              className={cn(
                ARROW_MOTION,
                "h-3.5 w-3.5",
                "group-hover:-translate-x-0.5 group-hover:text-magenta",
                "group-focus-visible:-translate-x-0.5 group-focus-visible:text-magenta",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
            The full schedule
          </Link>

          <div className="mt-8 grid overflow-hidden lg:grid-cols-[3fr_2fr]">
            <div className="relative aspect-4/3 bg-black lg:aspect-video">
              {room.image ? (
                <Image
                  src={room.image}
                  alt={room.name}
                  width={room.imageWidth ?? 1280}
                  height={room.imageHeight ?? 720}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  priority
                  className={cn(
                    "absolute inset-0 h-full w-full",
                    room.fit === "contain"
                      ? "object-contain"
                      : "object-cover object-center",
                  )}
                />
              ) : (
                <pre
                  aria-hidden="true"
                  className="overflow-x-auto p-4 font-mono text-[11px] leading-tight text-magenta"
                >
                  {room.ascii}
                </pre>
              )}
            </div>

            <div className="flex flex-col bg-black p-6 lg:p-8">
              <div className="mb-3.5 border-b border-white/10 pb-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                  {room.host}
                </p>
              </div>
              <h1 className="font-display text-3xl font-bold uppercase leading-none text-white sm:text-4xl">
                {room.name}
              </h1>
              <div className="mt-3">
                <span className="rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-magenta">
                  {room.tag}
                </span>
              </div>
              <p className="mt-4 text-pretty text-white/60">{room.desc}</p>
              <p className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-widest text-white/55">
                Sept 28 – Oct 2 · Downtown San Antonio
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Confirmed
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              What&rsquo;s running here.
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              More lands as it&rsquo;s locked. These are confirmed for{" "}
              {room.name}.
            </p>
          </div>

          <div className="mt-12 lg:mt-14">
            <SessionBento sessions={cards} />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Hosting is open · Sept 28 – Oct 2
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              Want a slot here?
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              Host an activation, sponsor the week, or just take a seat.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <ButtonLink href="/get-involved" size="lg">
                Get involved
              </ButtonLink>
              <Link
                href="/sessions"
                className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/50 transition-colors duration-200 hover:text-magenta"
              >
                Every room
                <ArrowUpRight
                  className={cn(
                    ARROW_MOTION,
                    "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  )}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
