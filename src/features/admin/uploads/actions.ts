"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/auth/guard";
import { createUploadSignature } from "@/lib/cloudinary";
import { fail, ok, type ActionResult } from "@/features/admin/action-result";

const folderSchema = z.enum(["products", "categories", "banners"]);

export type UploadSignature = ReturnType<typeof createUploadSignature>;

export async function getUploadSignature(folder: string): Promise<ActionResult<UploadSignature>> {
  await requireAdmin();
  const parsed = folderSchema.safeParse(folder);
  if (!parsed.success) return fail("Invalid upload folder");
  try {
    return ok(createUploadSignature(parsed.data));
  } catch (error) {
    console.error("Upload signature failed", error);
    return fail("Image uploads are not configured. Check the Cloudinary settings.");
  }
}
