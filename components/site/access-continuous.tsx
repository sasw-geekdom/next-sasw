import {
  ACCESS_CONTINUOUS,
  ACCESS_GREEN,
  ACCESS_ORGANIZERS,
} from "@/lib/access-granted";

/**
 * What runs the whole afternoon at Access Granted, under what runs to a clock.
 *
 * The running order above answers "what is on at 2:15". This answers the
 * question a reader has immediately afterwards, which is "and if I can't make
 * any of those?" — three things with no start time, which is exactly why none
 * of them belongs in the CMS as a session. See `ACCESS_CONTINUOUS`.
 *
 * Deliberately not a second running order. No times on the rows, no speaker
 * faces, and the rows are a list rather than the bordered grid
 * `ActivationSessions` draws — two of those stacked would read as one
 * programme split in half for no reason a reader can see.
 */
export function AccessContinuous() {
  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: ACCESS_GREEN }}
            >
              {ACCESS_CONTINUOUS.label}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              {ACCESS_CONTINUOUS.headline}
            </h2>
            <p className="mt-4 max-w-sm text-pretty text-white/55">
              {ACCESS_CONTINUOUS.lede}
            </p>
          </div>

          <ul className="flex flex-col">
            {ACCESS_CONTINUOUS.items.map((item) => {
              /* The org's address comes off ACCESS_ORGANIZERS rather than the
                 item, so the six marks in the band and this line cannot end up
                 pointing at different pages. An item naming an org that is not
                 in that list still renders — it just does not link. */
              const org = ACCESS_ORGANIZERS.find((o) => o.name === item.by);
              return (
                <li
                  key={item.name}
                  className="border-t border-white/10 py-6 first:border-t-0 first:pt-0"
                >
                  <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-tight text-white sm:text-2xl">
                    {item.name}
                  </h3>
                  {item.by && (
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
                      {/* "Powered by", the same words the running order
                          above uses on every session and the organiser strip
                          uses for all six at once. One relationship, one
                          phrase for it. */}
                      Powered by{" "}
                      {org ? (
                        <a
                          href={org.href}
                          target="_blank"
                          rel="noreferrer"
                          className="transition-colors duration-200 hover:text-white"
                          style={{ color: ACCESS_GREEN }}
                        >
                          {item.by}
                        </a>
                      ) : (
                        item.by
                      )}
                    </p>
                  )}
                  {item.note && (
                    <p className="mt-3 max-w-2xl text-pretty text-white/60">
                      {item.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
