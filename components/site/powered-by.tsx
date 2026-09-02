import { OrganizerLogo } from "@/components/site/organizer-logo";

/**
 * The "powered by" wall an activation gets when it has no band of its own.
 *
 * A mono label over a row of marks — the same treatment the banded
 * activations use, so an activation without a band credits its partners the
 * same way one with a band does.
 *
 * Shared because it is now drawn in two places: inside `ActivationDetail` for
 * activations that keep their section, and inside the hero for College Night,
 * which has no section to put it in. Those were the same fifteen lines twice,
 * which is exactly the pair that drifts.
 */
export function PoweredBy({
  orgs,
  className,
}: {
  orgs: readonly {
    name: string;
    logo: string;
    heightClass: string;
    href?: string;
  }[];
  className?: string;
}) {
  if (orgs.length === 0) return null;
  return (
    <div className={className}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
        Powered by
      </p>
      <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-6 sm:gap-x-10">
        {orgs.map((org) => (
          <li key={org.name}>
            <OrganizerLogo org={org} />
          </li>
        ))}
      </ul>
    </div>
  );
}
