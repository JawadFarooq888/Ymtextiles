"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CLEARED_FILTERS,
  SORTS,
  activeFilterCount,
  filtersToQuery,
  type FacetOptions,
  type Filters,
  type SortKey,
} from "@/features/catalog/filters";
import { formatPence } from "@/lib/money";
import { cn } from "@/lib/utils";

function useFilterNavigation(filters: Filters) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const go = (overrides: Partial<Filters>) =>
    startTransition(() =>
      router.push(`${pathname}${filtersToQuery(filters, { page: 1, ...overrides })}`, {
        scroll: false,
      }),
    );
  return { go, pending };
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function SortSelect({ filters }: { filters: Filters }) {
  const { go } = useFilterNavigation(filters);
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={filters.sort}
        onChange={(e) => go({ sort: e.target.value as SortKey })}
        aria-label="Sort products"
        className="h-11 rounded-full border border-input bg-background px-4 text-sm"
      >
        {Object.entries(SORTS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterPanel({ filters, facets }: { filters: Filters; facets: FacetOptions }) {
  const { go, pending } = useFilterNavigation(filters);
  const [min, setMin] = useState(filters.minPrice !== null ? String(filters.minPrice / 100) : "");
  const [max, setMax] = useState(filters.maxPrice !== null ? String(filters.maxPrice / 100) : "");
  const count = activeFilterCount(filters);

  const chip = (selected: boolean) =>
    cn(
      "flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background hover:border-primary",
    );

  return (
    <div className={cn("grid gap-6", pending && "opacity-60")} aria-busy={pending}>
      {count ? (
        <Button variant="ghost" className="justify-self-start" onClick={() => go(CLEARED_FILTERS)}>
          <XIcon /> Clear all filters ({count})
        </Button>
      ) : null}

      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={filters.inStock}
          onChange={() => go({ inStock: !filters.inStock })}
        />
        In stock only
      </label>

      <ChipGroup
        title="Waist (inches)"
        options={facets.waists.map((w) => ({ value: w, label: `W${w}` }))}
        selected={filters.waists}
        onToggle={(v) => go({ waists: toggle(filters.waists, v) })}
        chip={chip}
      />
      <ChipGroup
        title="Length (inches)"
        options={facets.lengths.map((l) => ({ value: l, label: `L${l}` }))}
        selected={filters.lengths}
        onToggle={(v) => go({ lengths: toggle(filters.lengths, v) })}
        chip={chip}
      />
      <ChipGroup
        title="Size"
        options={facets.otherSizes.map((s) => ({ value: s.id, label: s.label }))}
        selected={filters.sizes}
        onToggle={(v) => go({ sizes: toggle(filters.sizes, v) })}
        chip={chip}
      />

      {facets.colours.length ? (
        <FilterGroup title="Wash / colour">
          {facets.colours.map((c) => {
            const on = filters.colours.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                className={chip(on)}
                onClick={() => go({ colours: toggle(filters.colours, c.id) })}
              >
                <span
                  className="size-4 rounded-full border border-black/10"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden
                />
                {c.name}
              </button>
            );
          })}
        </FilterGroup>
      ) : null}

      <ChipGroup
        title="Fit"
        options={facets.fits.map((f) => ({ value: f, label: f }))}
        selected={filters.fits}
        onToggle={(v) => go({ fits: toggle(filters.fits, v) })}
        chip={chip}
        minOptions={2}
      />
      <ChipGroup
        title="Rise"
        options={facets.rises.map((r) => ({ value: r, label: `${r} rise` }))}
        selected={filters.rises}
        onToggle={(v) => go({ rises: toggle(filters.rises, v) })}
        chip={chip}
        minOptions={2}
      />
      <ChipGroup
        title="Stretch"
        options={facets.stretches.map((st) => ({ value: st, label: st }))}
        selected={filters.stretches}
        onToggle={(v) => go({ stretches: toggle(filters.stretches, v) })}
        chip={chip}
        minOptions={2}
      />

      {facets.priceRange ? (
        <FilterGroup title="Price (£)">
          <form
            className="flex w-full items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const toPence = (v: string) =>
                v.trim() === "" || isNaN(Number(v)) ? null : Math.round(Number(v) * 100);
              go({ minPrice: toPence(min), maxPrice: toPence(max) });
            }}
          >
            <label className="grid gap-1 text-xs">
              Min
              <input
                inputMode="decimal"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder={String(Math.floor(facets.priceRange.min / 100))}
                className="h-10 w-20 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs">
              Max
              <input
                inputMode="decimal"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder={String(Math.ceil(facets.priceRange.max / 100))}
                className="h-10 w-20 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            <Button type="submit" variant="outline" className="h-10 rounded-full">
              Apply
            </Button>
          </form>
          <p className="w-full text-xs text-muted-foreground">
            From {formatPence(facets.priceRange.min)} to {formatPence(facets.priceRange.max)}
          </p>
        </FilterGroup>
      ) : null}
    </div>
  );
}

function ChipGroup<T extends string | number>({
  title,
  options,
  selected,
  onToggle,
  chip,
  minOptions = 1,
}: {
  title: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  chip: (selected: boolean) => string;
  minOptions?: number;
}) {
  if (options.length < minOptions) return null;
  return (
    <FilterGroup title={title}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            className={chip(on)}
            onClick={() => onToggle(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </FilterGroup>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-[0.15em] text-brand-ink uppercase">
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function DesktopFilters(props: { filters: Filters; facets: FacetOptions }) {
  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <FilterPanel {...props} />
    </aside>
  );
}

export function MobileFilters({
  filters,
  facets,
  total,
}: {
  filters: Filters;
  facets: FacetOptions;
  total: number;
}) {
  const count = activeFilterCount(filters);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-11 rounded-full lg:hidden">
          <SlidersHorizontalIcon /> Filters{count ? ` (${count})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-background">
        <SheetHeader className="px-0">
          <SheetTitle className="font-heading text-2xl">Filters</SheetTitle>
          <SheetDescription>{total} product(s)</SheetDescription>
        </SheetHeader>
        <FilterPanel filters={filters} facets={facets} />
      </SheetContent>
    </Sheet>
  );
}
