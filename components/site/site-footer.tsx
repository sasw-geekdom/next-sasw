import Link from "next/link";
import { ROOMS } from "@/lib/locations";
import { venueRedirect } from "@/lib/schedule";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/sastartup/" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/san-antonio-startup-week/",
  },
  { label: "YouTube", href: "https://www.youtube.com/@Geekdomsa" },
  { label: "X", href: "https://x.com/Geekdom" },
];

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/sastw-vertical-magenta.svg"
              alt="San Antonio Startup + Tech Week"
              className="h-28 w-auto"
            />
            {/* One sentence: what the week is, when and where, and who runs
              it. The credit used to sit in a second, quieter paragraph
              underneath, which read as an afterthought bolted on rather than
              part of the same statement — the em dash carries the when and
              where, and the comma hands off to the who.

              The site names a host for every room and shows a partner wall,
              and until this line said nowhere at all who convenes the thing
              those rooms are part of. A footer is exactly the place for it. */}
            <p className="mt-5 max-w-sm text-sm text-white/60">
              Five circuits, six rooms, one current — Sept 28 – Oct 2 in San
              Antonio, curated by Geekdom and Launch SA with anchor venues and
              organisations across the city.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-4 sm:gap-12">
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-white/55">
                Event
              </div>
              <ul className="space-y-2 text-white/70">
                <li>
                  <Link href="/register" className="hover:text-magenta">
                    Register
                  </Link>
                </li>
                {/* Same order as the navbar — schedule, then speakers. */}
                <li>
                  <Link href="/schedule" className="hover:text-magenta">
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link href="/speakers" className="hover:text-magenta">
                    Speakers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-white/55">
                Get involved
              </div>
              <ul className="space-y-2 text-white/70">
                <li>
                  <Link href="/get-involved" className="hover:text-magenta">
                    Sponsor
                  </Link>
                </li>
                <li>
                  <Link href="/get-involved" className="hover:text-magenta">
                    Host an event
                  </Link>
                </li>
                <li>
                  <Link href="/get-involved" className="hover:text-magenta">
                    Ask a question
                  </Link>
                </li>
                <li>
                  <Link href="/plug-in" className="hover:text-magenta">
                    Speak
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-white/55">
                Where
              </div>
              {/*
                Derived from ROOMS, not retyped. The hand-written list had
                drifted: it omitted 300 Main while the blurb above still
                claimed five rooms, and it called Central Library "LaunchSA"
                — the org that programmes it, not the venue room-flow names.

                Linked through `venueRedirect` rather than straight at
                `/schedule/<room>`. Legacy Park and 300 Main host a single
                activation each and 308 to it, so the plain URL would make
                every footer click a redirect hop — and would be the only
                thing on the site still pointing at those two venue slugs.
                This sends people where they were going to end up anyway, and
                goes back to the venue page on its own if a room gains a
                second session.
              */}
              <ul className="space-y-2 text-white/70">
                {ROOMS.map((room) => (
                  <li key={room.slug}>
                    <Link
                      href={
                        venueRedirect(room.slug) ?? `/schedule/${room.slug}`
                      }
                      className="hover:text-magenta"
                    >
                      {room.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-white/55">
                Follow
              </div>
              <ul className="space-y-2 text-white/70">
                {SOCIALS.map(({ label, href }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Geekdom on ${label}`}
                      className="hover:text-magenta"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 San Antonio Startup + Tech Week</span>
          <Link
            href="/15-years"
            aria-label="15 years of Geekdom"
            className="group inline-flex items-center gap-2 text-white/55 transition-colors hover:text-white/70"
          >
            <span>15 years of</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/og-geekdom.svg"
              alt="Geekdom"
              className="h-4 w-auto opacity-50 transition-opacity group-hover:opacity-100"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
