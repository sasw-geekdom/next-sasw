import type { Metadata } from "next";
import { FormPage } from "@/components/site/form-page";
import { PlugInForm } from "@/components/forms/plug-in-form";

export const metadata: Metadata = {
  title: "Plug In",
  description:
    "Speak, volunteer, or sponsor San Antonio Startup + Tech Week — one way in.",
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
      subtitle="Speak, volunteer, or sponsor — this is the way in. Sept 28 – Oct 2."
    >
      <PlugInForm />
    </FormPage>
  );
}
