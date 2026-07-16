import type { Metadata } from "next";
import { FormPage } from "@/components/site/form-page";
import { PlugInForm } from "@/components/forms/plug-in-form";

export const metadata: Metadata = {
  title: "Plug In",
  description:
    "Sponsor, volunteer, or speak at San Antonio Startup + Tech Week — one way in.",
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
      subtitle="Sponsor, volunteer, or speak — every path feeds the same grid. Sept 28 – Oct 2, downtown San Antonio."
    >
      <PlugInForm />
    </FormPage>
  );
}
