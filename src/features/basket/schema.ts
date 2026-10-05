import { z } from "zod";
import { MAX_QUANTITY_PER_LINE } from "@/features/product/variants";

export const basketLineSchema = z.object({
  variantId: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const basketLinesSchema = z.array(basketLineSchema).min(1, "Your basket is empty").max(50);
