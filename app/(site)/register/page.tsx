import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FormPage } from "@/components/site/form-page";
import { RegistrationForm } from "@/components/forms/registration-form";

const DESCRIPTION =
  "Get on the list for San Antonio Startup + Tech Week — free, Sept 28 – Oct 2, downtown San Antonio.";

export const metadata: Metadata = {
  title: "Register",
  description: DESCRIPTION,
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Register · SASTW 2026",
    description: DESCRIPTION,
    url: "/register",
  },
  twitter: { title: "Register · SASTW 2026", description: DESCRIPTION },
};

export default function RegisterPage() {
  return (
    <FormPage
      eyebrow="Register · Free"
      title={
        <>
          Get on the <span className="text-magenta">list.</span>
        </>
      }
      subtitle="The current runs through SA, Sept 28 – Oct 2. Register free, pick your circuits, and we'll send you the schedule and where to be."
    >
      <RegistrationForm />
      {/*
        Points at /plug-in specifically, and not at /get-involved, because
        /get-involved is the one form page with a permanent navbar button —
        a second link to it here would duplicate what's already on screen.
        /plug-in has no nav presence at all and every other route to it sits
        on the /speakers surface, so this page — which takes both hero CTAs
        and is the busiest of the three — was the one place a would-be
        speaker could land with no way onward.

        Below the submit, matching /get-involved and /plug-in: registration
        is free and top-of-funnel, so the link should only catch someone who
        has already scrolled past the action, never compete with it.
      */}
      <p className="mt-8 text-sm text-muted-foreground">
        Want to be on the schedule?{" "}
        <Link
          href="/plug-in"
          className="inline-flex items-center gap-0.5 font-medium text-magenta-ink hover:underline"
        >
          Plug in
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </p>
    </FormPage>
  );
}
