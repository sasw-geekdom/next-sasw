import type { Metadata } from "next";
import { FormPage } from "@/components/site/form-page";
import { RegistrationForm } from "@/components/forms/registration-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Get on the list for San Antonio Startup + Tech Week.",
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
    </FormPage>
  );
}
