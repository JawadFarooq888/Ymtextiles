import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/admin/components/page-header";
import { AddUserDialog, UserRowActions } from "@/features/admin/users/users-ui";
import { listStaff } from "@/features/admin/users/service";
import { requireAdmin } from "@/features/auth/guard";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireAdmin(["ADMIN"]);
  const users = await listStaff();
  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in to this admin panel."
        actions={<AddUserDialog />}
      />
      <ul className="divide-y rounded-2xl border bg-card">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-ink">
                {u.name ?? u.email} {u.id === me.id ? <Badge variant="outline">You</Badge> : null}
              </p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <UserRowActions
              id={u.id}
              email={u.email}
              role={u.role === "ADMIN" ? "ADMIN" : "STAFF"}
              isSelf={u.id === me.id}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
