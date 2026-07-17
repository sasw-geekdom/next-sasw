import type { Metadata } from "next";
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
    </FormPage>
  );
}
