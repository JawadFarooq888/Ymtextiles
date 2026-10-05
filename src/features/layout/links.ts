const LEGAL_SLUGS = new Set(["privacy-policy", "terms", "cookie-policy"]);

type PageLink = { slug: string; title: string };

/** Help/information pages (everything except the legal ones), in admin order. */
export function helpPageLinks(pages: PageLink[]) {
  return pages
    .filter((p) => !LEGAL_SLUGS.has(p.slug))
    .map((p) => ({ label: p.title, href: `/pages/${p.slug}` }));
}

export function legalPageLinks(pages: PageLink[]) {
  return pages
    .filter((p) => LEGAL_SLUGS.has(p.slug))
    .map((p) => ({ label: p.title, href: `/pages/${p.slug}` }));
}
