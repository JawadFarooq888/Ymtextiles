import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { TAGS } from "@/lib/cache-tags";

export const dynamic = "force-dynamic";

const ALLOWED = [
  TAGS.catalog,
  TAGS.categories,
  TAGS.attributes,
  TAGS.banners,
  TAGS.settings,
] as const;
const bodySchema = z.object({ tags: z.array(z.enum(ALLOWED)).min(1).max(ALLOWED.length) });

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return (
    given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}

/**
 * Refresh cached shop data after changes made outside the admin panel
 * (e.g. scripts or direct database edits). Requires `Authorization: Bearer $CRON_SECRET`.
 *
 *   curl -X POST https://site/api/revalidate -H "Authorization: Bearer $CRON_SECRET" \
 *        -H "Content-Type: application/json" -d '{"tags":["catalog","banners"]}'
 */
export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `tags must be some of: ${ALLOWED.join(", ")}` },
      { status: 400 },
    );
  }
  for (const tag of parsed.data.tags) revalidateTag(tag);
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: parsed.data.tags });
}
