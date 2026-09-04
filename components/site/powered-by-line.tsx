import { cn } from "@/lib/utils";

/**
 * "Powered by —" and a name, on one line in the hero.
 *
 * The sibling of `CircuitSponsorLine`, in the same mono register and the same
 * slot, and deliberately not `PoweredBy`. That one is a wall of marks under a
 * lede, and it lives on `detail`, which requires a `headline` and a `lede` to
 * exist at all — an activation whose page is a hero and a running order has
 * no `detail` to hang it on, and inventing one to carry a credit would switch
 * on a narrative section the page doesn't have.
 *
 * Names, not marks, because there are none: neither PNC Bank nor Active
 * Capital is in `sponsors` or `partners`, so there is nothing to draw. Set in
 * the body face rather than the display one on purpose — a bank's name in
 * Oswald uppercase reads as a wordmark we invented for them. When their marks
 * land in the CMS this line should take them the way the circuit line does.
 */
export function PoweredByLine({
  orgs,
  className,
}: {
  orgs: readonly { name: string; href?: string }[];
  className?: string;
}) {
  if (orgs.length === 0) return null;
  return (
    // `gap-x-2.5`, not the `gap-x-4` CircuitSponsorLine uses. That line puts a
    // 32px mark on the right of the label, where 16px reads as a normal
    // separation; here the right side is 16px type, so the same 16px is a full
    // em of the value and nearly one and a half of the 11px label, and the
    // pair came apart into two phrases. 10px puts "Powered by" back in front
    // of the name as one line.
    <div
      className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-2", className)}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
        Powered by
      </p>
      {/* Wider than the gap above it on purpose: the label belongs to the
          first name, and two names belong to each other less tightly than
          that. */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {orgs.map((org) => (
          <li key={org.name} className="text-white/85">
            {org.href ? (
              <a
                href={org.href}
                target="_blank"
                rel="noreferrer"
                className="transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
              >
                {org.name}
              </a>
            ) : (
              org.name
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
