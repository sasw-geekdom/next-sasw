import { Globe } from "lucide-react";
import { LinkedInMark } from "@/components/site/linkedin-mark";

// What a speaker's one outbound link actually points at.
//
// The CMS field is called `linkedin` and for everyone but one speaker that is
// what it holds. Beck has no LinkedIn and gave learnopen.tech instead, and a
// globe labelled "LinkedIn" is worse than no link at all — it tells the reader
// where they are going and is wrong.
//
// Read off the host rather than a flag on the record, so it is right for the
// next speaker who does this without anyone remembering to tick a box, and so
// it cannot disagree with the URL underneath it. Renaming the field would be
// the tidier fix and it reaches the admin, the API and the row type; this does
// not, and the field's name is only ever seen by us.

function host(url: string): string {
  try {
    // The admin does not force a protocol, and `new URL` needs one.
    return new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
    ).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isLinkedIn(url: string): boolean {
  const h = host(url);
  return h === "linkedin.com" || h.endsWith(".linkedin.com");
}

/** The glyph for wherever this link goes. */
export function ProfileMark({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return isLinkedIn(href) ? (
    <LinkedInMark className={className} />
  ) : (
    // Stroked where LinkedIn's is filled, which is as close as the two get.
    // They never appear beside each other — one speaker has one link — so the
    // weights have nothing to be inconsistent with.
    <Globe className={className} strokeWidth={2} aria-hidden="true" />
  );
}

/** The word on the button, where a surface has room for one. */
export function profileWord(href: string): string {
  return isLinkedIn(href) ? "LinkedIn" : "Website";
}

/** What a screen reader is told the link is. */
export function profileLabel(name: string, href: string): string {
  return isLinkedIn(href) ? `${name} on LinkedIn` : `${name}’s website`;
}
