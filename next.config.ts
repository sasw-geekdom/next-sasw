import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  // sharp is a native module (used by the gallery thumbnail pipeline) — keep it
  // external so the bundler doesn't try to bundle its platform binaries.
  serverExternalPackages: ["sharp"],
  images: {
    // Vercel Blob (CMS/admin images) + Firebase Storage (video) remote sources.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default withBotId(nextConfig);
