import { formatPence, percentOff } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  basePrice,
  salePrice,
  size = "sm",
  showPercent = false,
}: {
  basePrice: number;
  salePrice: number | null;
  size?: "sm" | "lg";
  showPercent?: boolean;
}) {
  const onSale = salePrice !== null && salePrice < basePrice;
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2",
        size === "lg" ? "text-2xl" : "text-sm",
      )}
    >
      {onSale ? (
        <>
          <span className="font-medium text-brand-sale">
            <span className="sr-only">Sale price </span>
            {formatPence(salePrice)}
          </span>
          <s className={cn("text-muted-foreground", size === "lg" ? "text-base" : "text-xs")}>
            <span className="sr-only">Was </span>
            {formatPence(basePrice)}
          </s>
          {showPercent ? (
            <span
              className={cn(
                "rounded-full bg-brand-sale px-2 py-0.5 font-medium text-white",
                size === "lg" ? "text-sm" : "text-[11px]",
              )}
            >
              {percentOff(basePrice, salePrice)}% off
            </span>
          ) : null}
        </>
      ) : (
        <span className="font-medium text-brand-ink">{formatPence(basePrice)}</span>
      )}
    </p>
  );
}
