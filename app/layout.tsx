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
  metadataBase: new URL("https://sasw.co"),
  title: {
    default: "San Antonio Startup + Tech Week",
    template: "%s · SASTW",
  },
  description:
    "San Antonio Startup + Tech Week — Sept 28 – Oct 2, 2026. Five circuits, one current. Founders, builders, and the community that backs them. Plug in.",
  applicationName: "SASTW",
  keywords: [
    "San Antonio Startup Week",
    "San Antonio Tech Week",
    "SASTW",
    "startup week",
    "tech week",
    "San Antonio startups",
    "San Antonio founders",
    "Geekdom",
    "DEVSA",
    "2026",
  ],
  authors: [{ name: "Geekdom" }],
  creator: "Geekdom",
  category: "event",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://sasw.co",
    siteName: "San Antonio Startup + Tech Week",
    title: "San Antonio Startup + Tech Week",
    description: "Sept 28 – Oct 2, 2026. Five circuits, one current. Plug in.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "San Antonio Startup + Tech Week",
    description: "Sept 28 – Oct 2, 2026. Five circuits, one current. Plug in.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
