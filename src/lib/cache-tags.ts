// Cache tags used with unstable_cache / revalidateTag so admin edits show up on the shop immediately.
export const TAGS = {
  catalog: "catalog",
  categories: "categories",
  attributes: "attributes",
  banners: "banners",
  settings: "settings",
  product: (slug: string) => `product:${slug}`,
} as const;
