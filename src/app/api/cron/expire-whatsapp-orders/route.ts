import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { expireUnconfirmedWhatsAppOrders } from "@/features/orders/service";

export const dynamic = "force-dynamic";

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return (
    given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}

/** Called by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cancelled = await expireUnconfirmedWhatsAppOrders();
  if (cancelled > 0) revalidatePath("/admin", "layout");
  return NextResponse.json({ cancelled });
}
