import type { Metadata } from "next";
import Link from "next/link";
import { FormPage } from "@/components/site/form-page";
import { SpeakerForm } from "@/components/forms/speaker-form";

export const metadata: Metadata = {
  title: "Plug In",
  description:
    "Pitch a session for San Antonio Startup + Tech Week — five circuits, one current.",
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
          className="font-medium text-magenta hover:underline"
        >
          Get involved &nearr;
        </Link>
      </p>
    </FormPage>
  );
}
