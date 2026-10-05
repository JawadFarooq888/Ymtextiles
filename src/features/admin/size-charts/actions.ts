"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { sizeChartSchema } from "@/features/admin/size-charts/schema";
import { deleteSizeChart, saveSizeChart } from "@/features/admin/size-charts/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh() {
  revalidateTag(TAGS.catalog);
  revalidatePath("/admin/size-charts");
}

export async function saveSizeChartAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = sizeChartSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const chart = await saveSizeChart(parsed.data);
    refresh();
    return ok({ id: chart.id });
  } catch (error) {
    return fromUnknownError(error, "saveSizeChart");
  }
}

export async function deleteSizeChartAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid size chart");
  try {
    await deleteSizeChart(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteSizeChart");
  }
}
