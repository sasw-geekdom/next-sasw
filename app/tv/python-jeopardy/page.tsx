import type { Metadata } from "next";
import { UnifrakturMaguntia } from "next/font/google";
import { PythonJeopardy } from "@/components/tv/python-jeopardy";

// The closing social at PySanAntonio II: a Jeopardy board for the projector
// at Geekdom, run by one host on a mic. A static segment, so it wins over
// /tv/[slug]. The questions are in lib/python-jeopardy.ts.

// Blackletter for the Daily Double, after PySA's own wordmark. Loaded here
// and nowhere else, so the rest of the site never downloads it.
const fraktur = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fraktur",
});

export const metadata: Metadata = {
  title: "TV · Python Jeopardy",
};

export default function PythonJeopardyPage() {
  return (
    <div className={fraktur.variable}>
      <PythonJeopardy />
    </div>
  );
}
