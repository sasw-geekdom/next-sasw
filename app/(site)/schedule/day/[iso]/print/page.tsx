import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENT_DAYS } from "@/lib/event";
import { liveSchedule } from "@/lib/live-schedule";
import { venueGetThere } from "@/lib/locations";
import { dayCalendar } from "@/lib/schedule";
import { PrintButton } from "@/components/site/live/print-button";

// A day's schedule for paper — registration tables, a desk, "Save as PDF".
// Room by room, like the image (see ../image/route.tsx), in black on white
// so it prints on any printer; the navbar and footer drop out of print.
// `?venue=<slug>` narrows it to one room, the same as the image.

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Printable schedule",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return EVENT_DAYS.map((d) => ({ iso: d.iso }));
}

export default async function PrintDay({
  params,
  searchParams,
}: {
  params: Promise<{ iso: string }>;
  searchParams: Promise<{ venue?: string }>;
}) {
  const { iso } = await params;
  const { venue } = await searchParams;
  const live = await liveSchedule();
  const data = dayCalendar(iso, live.items, live.attached);
  if (!data) notFound();
  const where = venueGetThere();
  const index = EVENT_DAYS.findIndex((d) => d.iso === iso);

  const venues = data.venues
    .filter((v) => !venue || v.slug === venue)
    .map((v) => ({
      ...v,
      items: data.items.filter((i) => i.venueSlug === v.slug).sort((a, b) => a.startMin - b.startMin),
      spans: data.spans.filter((s) => s.venueSlug === v.slug),
    }))
    .filter((v) => v.items.length || v.spans.length);

  return (
    <main className="bg-white text-black print:bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12 print:max-w-none print:px-0 print:py-0">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <p className="text-sm text-black/60">This page is laid out for printing, or for saving as a PDF.</p>
          <PrintButton />
        </div>

        <header className="flex items-center justify-between border-b-2 border-black pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sastw-horizontal-black.svg" alt="San Antonio Startup + Tech Week" className="h-10 w-auto" />
          <p className="font-mono text-xs uppercase tracking-widest text-black/60">Sept 28 – Oct 2, 2026</p>
        </header>

        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-[#c7277d]">
          Day {index + 1} of {EVENT_DAYS.length} · {data.day.label}
        </p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none">{data.day.weekday}.</h1>

        {venues.length === 0 && <p className="mt-8 text-black/70">Nothing on the schedule here this day.</p>}

        {venues.map((v) => {
          const w = where[v.slug];
          return (
            <section key={v.slug} className="mt-8 break-inside-avoid-page">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-[#ff32a0] pb-1.5">
                <h2 className="font-display text-2xl font-bold uppercase">{v.name}</h2>
                <p className="font-mono text-[11px] uppercase tracking-widest text-black/60">
                  {[w?.floor, w?.address].filter(Boolean).join(" · ")}
                </p>
              </div>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {v.spans.map((s) => (
                    <tr key={s.slug} className="border-b border-black/15">
                      <td className="w-32 py-2 pr-4 align-top font-mono text-xs uppercase">All day</td>
                      <td className="py-2 font-semibold">{s.title}</td>
                    </tr>
                  ))}
                  {v.items.map((i) => (
                    <tr key={i.slug} className="break-inside-avoid border-b border-black/15">
                      <td className="w-32 py-2 pr-4 align-top font-mono text-xs uppercase">{i.timeLabel}</td>
                      <td className="py-2">
                        {(i.cancelled || i.changeNote) && (
                          <span className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-[#c7277d]">
                            {i.cancelled ? "Cancelled" : "Changed"}
                            {i.changeNote ? ` · ${i.changeNote}` : ""}
                          </span>
                        )}
                        <span className={i.cancelled ? "font-semibold line-through" : "font-semibold"}>
                          {i.longTitle || i.title}
                        </span>
                        {i.people && <span className="block text-xs text-black/60">{i.people}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}

        <footer className="mt-10 border-t border-black/20 pt-3 font-mono text-[10px] uppercase tracking-widest text-black/55">
          Times can change · live schedule at sasw.co/schedule/day/{iso}
        </footer>
      </div>
    </main>
  );
}
