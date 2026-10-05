import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/auth.config";

/**
 * Server-side role check. Middleware already protects /admin, but every admin
 * page and server action calls this too, because actions can be invoked directly.
 */
export async function requireAdmin(roles: readonly Role[] = ADMIN_ROLES) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !role || !roles.includes(role)) {
    redirect("/admin/login");
  }
  return session.user;
}
