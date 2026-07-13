import type { Metadata } from "next";
import { RegistrationForm } from "@/components/forms/registration-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Get on the list for San Antonio Startup + Tech Week.",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-magenta">
        Register · Free
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-none text-foreground sm:text-5xl">
        Get on the list.
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        The current runs through SA, Sept 28 – Oct 2. Register free. We&apos;ll
        send you the schedule and where to be.
      </p>

      <div className="mt-10">
        <RegistrationForm />
      </div>
    </main>
  );
}
