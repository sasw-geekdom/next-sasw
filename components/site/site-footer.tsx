import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/sastw-vertical-magenta.svg"
              alt="San Antonio Startup + Tech Week"
              className="h-28 w-auto"
            />
            <p className="mt-5 max-w-xs text-sm text-white/60">
              The current runs through SA. Sept 28 – Oct 2. Plug in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:gap-16">
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-white/40">
                Event
              </div>
              <ul className="space-y-2 text-white/70">
                <li>
                  <Link href="/register" className="hover:text-magenta">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/plug-in" className="hover:text-magenta">
                    Plug in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-white/40">
                Where
              </div>
              <ul className="space-y-2 text-white/70">
                <li>Downtown at TPR</li>
                <li>San Antonio, TX</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 San Antonio Startup + Tech Week</span>
          <Link
            href="/15-years"
            aria-label="15 years of Geekdom"
            className="group inline-flex items-center gap-2 text-white/40 transition-colors hover:text-white/70"
          >
            <span>Powered by</span>
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
