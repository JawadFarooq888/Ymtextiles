import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/auth.config";
import { exportSubscribersCsv } from "@/features/admin/newsletter/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const csv = await exportSubscribersCsv();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ym-textiles-newsletter-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
