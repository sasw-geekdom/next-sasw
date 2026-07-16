import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FormPage } from "@/components/site/form-page";
import { GetInvolvedForm } from "@/components/forms/get-involved-form";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Sponsor, host an event, or ask a question — get involved with San Antonio Startup + Tech Week.",
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
      subtitle="Sponsor, host an event, or just ask — every connection feeds the grid. Sept 28 – Oct 2, downtown San Antonio."
    >
      <GetInvolvedForm />
      <p className="mt-8 text-sm text-muted-foreground">
        Have a session to pitch?{" "}
        <Link
          href="/plug-in"
          className="inline-flex items-center gap-0.5 font-medium text-magenta hover:underline"
        >
          Plug in
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </p>
    </FormPage>
  );
}
