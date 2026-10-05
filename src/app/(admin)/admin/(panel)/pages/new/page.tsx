import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { PageForm } from "@/features/admin/pages/page-form";

export const metadata: Metadata = { title: "New page" };

export default function NewPagePage() {
  return (
    <>
      <PageHeader title="New page" />
      <PageForm
        isSystem={false}
        initial={{
          title: "",
          slug: "",
          body: "",
          metaDescription: "",
          isPublished: true,
          sortOrder: "10",
        }}
      />
    </>
  );
}
