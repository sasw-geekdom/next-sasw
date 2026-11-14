import type { Metadata } from "next";
import { FaqBoard } from "@/components/site/faq-board";
import { getFaqSections } from "@/lib/faq-content";
import { faqGraph, jsonLd } from "@/lib/structured-data";

const DESCRIPTION =
  "Badge pickup, parking and rooms for San Antonio Startup + Tech Week — Sept 28 – Oct 2, downtown San Antonio.";

// The questions come from the CMS now (Admin → Content → FAQ). Saves bust this
// path; the window is the ceiling if a bust is ever missed.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Attending",
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Attending · SASTW 2026",
    description: DESCRIPTION,
    url: "/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Attending · SASTW 2026",
    description: DESCRIPTION,
  },
};

/**
 * "Attending" rather than "FAQ" in the title, and /faq as the path.
 *
 * The path is what people type and what a link from a group's own page will
 * say; the title is what the tab and the search result say, and "FAQ · SASTW"
 * tells a reader nothing about which week or what is being asked.
 */
export default async function FaqPage() {
  const sections = await getFaqSections();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqGraph(sections)) }}
      />
      <FaqBoard sections={sections} />
    </>
  );
}
