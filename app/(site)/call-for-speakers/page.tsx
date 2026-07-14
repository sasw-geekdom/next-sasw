import type { Metadata } from "next";
import { FormPage } from "@/components/site/form-page";
import { SpeakerForm } from "@/components/forms/speaker-form";

export const metadata: Metadata = {
  title: "Call for Speakers",
  description: "Pitch a session for San Antonio Startup + Tech Week.",
};

export default function CallForSpeakersPage() {
  return (
    <FormPage
      eyebrow="Call for Speakers"
      title={
        <>
          Take the <span className="text-magenta">stage.</span>
        </>
      }
      subtitle="Sept 28 – Oct 2. Pitch a session. Name the room you want to be in."
    >
      <SpeakerForm />
    </FormPage>
  );
}
