import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  // sharp is a native module (used by the gallery thumbnail pipeline) — keep it
  // external so the bundler doesn't try to bundle its platform binaries.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // CMS image uploads go through server actions, and the default cap is
      // 1 MB — under a typical headshot, so saving a speaker blew up with
      // "Body exceeded 1 MB limit" before validation ever ran.
      //
      // 4mb, not more: Vercel caps a function's request body at 4.5 MB and no
      // config lifts that, so anything higher would just move the failure to a
      // 413. The remainder is headroom for the boundary and part headers
      // multipart adds around the file. Keep in step with MAX_IMAGE_BYTES in
      // lib/images.ts.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // Vercel Blob (CMS/admin images) + Firebase Storage (video) remote sources.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  async redirects() {
    // The Call for Speakers page became the Plug In hub — keep old links alive.
    return [
      { source: "/call-for-speakers", destination: "/plug-in", permanent: true },
    ];
  },
};

export default withBotId(nextConfig);
