import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/page-header";
import { PageForm } from "@/features/admin/pages/page-form";
import { getPageForEdit } from "@/features/admin/pages/service";
import { SYSTEM_PAGE_SLUGS } from "@/features/content/defaults";

export const metadata: Metadata = { title: "Edit page" };
export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getPageForEdit(id);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={`Edit: ${page.title}`} />
      <PageForm
        key={page.updatedAt.toISOString()}
        isSystem={SYSTEM_PAGE_SLUGS.has(page.slug)}
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          body: page.body,
          metaDescription: page.metaDescription ?? "",
          isPublished: page.isPublished,
          sortOrder: String(page.sortOrder),
        }}
      />
    </>
  );
}
