import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/features/catalog/components/breadcrumbs";
import { SYSTEM_PAGES } from "@/features/content/defaults";
import { LiveInfoAfter, LiveInfoBefore } from "@/features/content/pages";
import { getPage, getSizeChartsForGuide } from "@/features/content/queries";
import { getSettings } from "@/lib/settings";
import { SimpleText } from "@/lib/simple-text";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return SYSTEM_PAGES.map((p) => ({ slug: p.slug }));
}

// Pages added in admin are rendered on first request; edits refresh via the "pages" tag.
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `/pages/${slug}` },
  };
}

export default async function ContentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const [settings, sizeCharts] = await Promise.all([
    getSettings(),
    slug === "size-guide" ? getSizeChartsForGuide() : Promise.resolve([]),
  ]);
  const ctx = { settings, sizeCharts };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: page.title }]} />
      <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{page.title}</h1>
      <div className="prose-ym mt-8">
        <LiveInfoBefore slug={slug} ctx={ctx} />
        <SimpleText text={page.body} />
        <LiveInfoAfter slug={slug} ctx={ctx} />
      </div>
    </div>
  );
}
