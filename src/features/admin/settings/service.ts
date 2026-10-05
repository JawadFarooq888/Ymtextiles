import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import type { settingsSchema } from "@/features/admin/settings/schema";

export function getSettingsForAdmin() {
  return db.settings.findUnique({ where: { id: 1 } });
}

export function saveSettings(data: z.output<typeof settingsSchema>) {
  return db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
}
