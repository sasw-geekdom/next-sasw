import type { Metadata } from "next";
import { FormPage } from "@/components/site/form-page";
import { GetInvolvedForm } from "@/components/forms/get-involved-form";

const DESCRIPTION =
  "Sponsor, host an event, or ask a question — get involved with year 12 of San Antonio Startup + Tech Week.";

export const metadata: Metadata = {
  title: "Get Involved",
  description: DESCRIPTION,
  alternates: { canonical: "/get-involved" },
  openGraph: {
    title: "Get Involved · SASTW 2026",
    description: DESCRIPTION,
    url: "/get-involved",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Involved · SASTW 2026",
    description: DESCRIPTION,
  },
};

export default function GetInvolvedPage() {
  return (
    <FormPage
      eyebrow="Get involved"
      title={
        <>
          Power the <span className="text-magenta">week.</span>
        </>
      }
      // Year 11 has run, so this looks to the next one. No dates: year 12's
      // are not set, and a guess would be the first thing a sponsor quotes.
      subtitle="Year 12 starts here. Sponsor, host an event, or just ask — every connection feeds the grid."
    >
      <GetInvolvedForm />
    </FormPage>
  );
}
