import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/auth.config";
import { exportProductsCsv } from "@/features/admin/products/csv-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const csv = await exportProductsCsv();
  const date = new Date().toISOString().slice(0, 10);
  // Leading BOM so Excel opens the file as UTF-8 (keeps the £ sign intact).
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ym-textiles-products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
