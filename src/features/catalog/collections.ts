import type { CatalogProduct, NavCategory } from "@/features/catalog/types";

interface VirtualCollection {
  title: string;
  description: string;
  match: (p: CatalogProduct) => boolean;
}

/** Collections that are filters rather than database categories. */
export const VIRTUAL_COLLECTIONS: Record<string, VirtualCollection> = {
  "new-in": {
    title: "New In",
    description: "The latest arrivals, freshly stocked in the UK.",
    match: (p) => p.isNew,
  },
  lawn: {
    title: "Lawn",
    description: "Light, breathable lawn suits for warmer days.",
    match: (p) => p.fabric?.toLowerCase() === "lawn",
  },
  sale: {
    title: "Sale",
    description: "Reduced prices while stock lasts.",
    match: (p) => p.salePrice !== null,
  },
  "best-sellers": {
    title: "Best Sellers",
    description: "Customer favourites.",
    match: (p) => p.isBestSeller,
  },
  all: {
    title: "All products",
    description: "Everything currently in stock and on its way.",
    match: () => true,
  },
};

export interface ResolvedCollection {
  slug: string;
  title: string;
  description: string | null;
  /** Breadcrumb trail of parent categories */
  parents: { name: string; slug: string }[];
  /** Child categories to show as quick links */
  children: { name: string; slug: string }[];
  match: (p: CatalogProduct) => boolean;
}

function flatten(
  nodes: NavCategory[],
  parents: NavCategory[] = [],
): [NavCategory, NavCategory[]][] {
  return nodes.flatMap((n) => [
    [n, parents] as [NavCategory, NavCategory[]],
    ...flatten(n.children, [...parents, n]),
  ]);
}

function descendantIds(node: NavCategory): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

export function resolveCollection(slug: string, tree: NavCategory[]): ResolvedCollection | null {
  const virtual = VIRTUAL_COLLECTIONS[slug];
  if (virtual) {
    return { slug, ...virtual, parents: [], children: [] };
  }
  const found = flatten(tree).find(([n]) => n.slug === slug);
  if (!found) return null;
  const [node, parents] = found;
  const ids = new Set(descendantIds(node));
  return {
    slug,
    title: node.name,
    description: node.description,
    parents: parents.map((p) => ({ name: p.name, slug: p.slug })),
    children: node.children.map((c) => ({ name: c.name, slug: c.slug })),
    match: (p) => ids.has(p.categoryId),
  };
}

export interface MenuItem {
  label: string;
  href: string;
  children: { label: string; href: string }[];
  image: string | null;
  highlight?: boolean;
}

export interface MenuOptions {
  showNewIn: boolean;
  showLawn: boolean;
  showSale: boolean;
}

/** Header menu: New In, the top-level categories (with sub-categories), Lawn, Sale (each optional in Settings). */
export function buildMenu(
  tree: NavCategory[],
  options: MenuOptions = { showNewIn: true, showLawn: true, showSale: true },
): MenuItem[] {
  const items: (MenuItem | false)[] = [
    options.showNewIn && {
      label: "New In",
      href: "/collections/new-in",
      children: [],
      image: null,
    },
    ...tree.map((c) => ({
      label: c.name,
      href: `/collections/${c.slug}`,
      image: c.image,
      children: c.children.map((child) => ({
        label: child.name,
        href: `/collections/${child.slug}`,
      })),
    })),
    options.showLawn && { label: "Lawn", href: "/collections/lawn", children: [], image: null },
    options.showSale && {
      label: "Sale",
      href: "/collections/sale",
      children: [],
      image: null,
      highlight: true,
    },
  ];
  return items.filter((item): item is MenuItem => item !== false);
}
