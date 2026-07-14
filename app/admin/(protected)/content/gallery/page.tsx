import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getGalleryManifest } from "@/lib/gallery";
import { PageHeader } from "@/components/admin/page-header";
import { GalleryManager } from "@/components/admin/cms/gallery-manager";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";
// Thumbnail generation can be heavy on a big first batch.
export const maxDuration = 300;

export default async function GalleryPage() {
  await requireAdmin();
  const items = await getGalleryManifest();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gallery"
        description="The 15-years photo wall. Upload originals to the 15-years/ Storage folder, then sync to build optimized thumbnails."
      />
      <GalleryManager
        count={items.length}
        thumbs={items.map((i) => ({ name: i.name, url: i.url }))}
      />
    </div>
  );
}
