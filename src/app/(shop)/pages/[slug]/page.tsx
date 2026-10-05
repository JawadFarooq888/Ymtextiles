import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/features/catalog/components/breadcrumbs";
import { CONTENT_PAGES } from "@/features/content/pages";
import { getSizeChartsForGuide } from "@/features/content/queries";
import { getSettings } from "@/lib/settings";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return Object.keys(CONTENT_PAGES).map((slug) => ({ slug }));
}

// Unknown slugs 404 via notFound() below. Pages that failed to prerender (e.g. a slow
// database during the build) are rendered on request instead of becoming a 404.
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = CONTENT_PAGES[slug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/pages/${slug}` },
  };
}

export default async function ContentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = CONTENT_PAGES[slug];
  if (!page) notFound();
  const [settings, sizeCharts] = await Promise.all([getSettings(), getSizeChartsForGuide()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: page.title }]} />
      <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{page.title}</h1>
      <div className="prose-ym mt-8">{page.render({ settings, sizeCharts })}</div>
    </div>
  );
}
