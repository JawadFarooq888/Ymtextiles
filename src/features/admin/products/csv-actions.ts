"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { importProductsCsv, type CsvImportSummary } from "@/features/admin/products/csv-service";
import { fail, fromUnknownError, ok, type ActionResult } from "@/features/admin/action-result";

const csvTextSchema = z
  .string()
  .min(1, "The file is empty")
  .max(4_500_000, "The file is too large");

export async function importProductsCsvAction(
  csvText: unknown,
): Promise<ActionResult<CsvImportSummary>> {
  await requireAdmin();
  const parsed = csvTextSchema.safeParse(csvText);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid file");
  try {
    const summary = await importProductsCsv(parsed.data);
    revalidateTag(TAGS.catalog);
    revalidateTag(TAGS.attributes);
    revalidatePath("/admin/products");
    return ok(summary);
  } catch (error) {
    return fromUnknownError(error, "importProductsCsv");
  }
}
