import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FormPage } from "@/components/site/form-page";
import { SpeakerForm } from "@/components/forms/speaker-form";

const DESCRIPTION =
  "Pitch a session for San Antonio Startup + Tech Week — five circuits, one current. Sept 28 – Oct 2.";

export const metadata: Metadata = {
  title: "Plug In",
  description: DESCRIPTION,
  alternates: { canonical: "/plug-in" },
  openGraph: {
    title: "Plug In · SASTW 2026",
    description: DESCRIPTION,
    url: "/plug-in",
  },
  twitter: { title: "Plug In · SASTW 2026", description: DESCRIPTION },
};

export default function PlugInPage() {
  return (
    <FormPage
      eyebrow="Plug in"
      title={
        <>
          Get in the <span className="text-magenta">current.</span>
        </>
      }
      subtitle="Have something worth saying? Pitch a session — five circuits, one current. Sept 28 – Oct 2."
    >
      <SpeakerForm />
      <p className="mt-8 text-sm text-muted-foreground">
        Want to sponsor or host an event?{" "}
        <Link
          href="/get-involved"
          className="inline-flex items-center gap-0.5 font-medium text-magenta hover:underline"
        >
          Get involved
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </p>
    </FormPage>
  );
}
