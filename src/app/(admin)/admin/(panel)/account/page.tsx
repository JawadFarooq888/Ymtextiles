import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { ChangeOwnPasswordForm } from "@/features/admin/users/users-ui";
import { requireAdmin } from "@/features/auth/guard";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <>
      <PageHeader title="My account" description={`Signed in as ${me.email}`} />
      <ChangeOwnPasswordForm />
    </>
  );
}
