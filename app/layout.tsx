import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

// Body — Geist Sans (per the build spec, overriding the brand's Open Sans).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Data / metadata — Geist Mono.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display / headings — Oswald (brand primary).
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "San Antonio Startup + Tech Week",
    template: "%s · SASTW",
  },
  description:
    "The current runs through SA. September 28 – October 2. Plug in.",
  metadataBase: new URL("https://sasw.co"),
  openGraph: {
    title: "San Antonio Startup + Tech Week",
    description: "Sept 28 – Oct 2, downtown. Plug in.",
    siteName: "SASTW",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
