import { cn } from "@/lib/utils";

/** Branded stand-in shown when a product has no photo yet. */
export function ImagePlaceholder({
  className,
  label,
  decorative = false,
}: {
  className?: string;
  label?: string;
  decorative?: boolean;
}) {
  return (
    <div
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": label ?? "Photo coming soon" })}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 bg-secondary text-brand-gold-dark",
        className,
      )}
    >
      <span className="font-heading text-4xl tracking-widest">YM</span>
      <span className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
        Photo coming soon
      </span>
    </div>
  );
}
