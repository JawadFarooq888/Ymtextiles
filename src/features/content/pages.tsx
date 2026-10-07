import { parseSizeChart } from "@/features/size-charts/chart";
import type { Settings } from "@prisma/client";
import { SizeChartTable } from "@/features/product/components/size-chart-dialog";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";
import { formatPence } from "@/lib/money";

/**
 * Live information shown on some pages next to the owner's text, so fees,
 * returns days, contact details and size charts always match Settings.
 */
export interface LiveContext {
  settings: Settings;
  sizeCharts: { id: string; name: string; columns: unknown; rows: unknown; notes: string | null }[];
}

export function LiveInfoBefore({ slug, ctx }: { slug: string; ctx: LiveContext }) {
  const { settings } = ctx;
  if (slug === "delivery-returns") {
    return (
      <section
        className="not-prose rounded-2xl bg-secondary p-5 text-sm"
        aria-labelledby="delivery-facts"
      >
        <h2 id="delivery-facts" className="mb-2 font-heading text-2xl font-semibold text-brand-ink">
          Delivery (UK)
        </h2>
        <ul className="grid gap-1">
          <li>
            Standard delivery: {formatPence(settings.standardDeliveryFee)}
            {settings.freeDeliveryThreshold > 0
              ? `, free on orders over ${formatPence(settings.freeDeliveryThreshold)}`
              : ""}
          </li>
          <li>Express delivery: {formatPence(settings.expressDeliveryFee)}</li>
          {settings.dispatchInfo ? <li>{settings.dispatchInfo}</li> : null}
          <li>Returns: {settings.returnsDays} days from delivery to cancel and return.</li>
        </ul>
      </section>
    );
  }
  if (slug === "contact") {
    return (
      <section className="not-prose grid gap-3 rounded-2xl bg-secondary p-5 text-sm">
        <a
          href={buildWhatsAppUrl(
            settings.whatsappNumber,
            `Hi ${settings.storeName}, I have a question.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-self-start rounded-full bg-primary px-8 font-medium text-primary-foreground"
        >
          Chat on WhatsApp
        </a>
        {settings.contactEmail ? (
          <p>
            Email:{" "}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="text-primary underline underline-offset-4"
            >
              {settings.contactEmail}
            </a>
          </p>
        ) : null}
        {settings.businessAddress ? (
          <p className="whitespace-pre-line">Address: {settings.businessAddress}</p>
        ) : null}
      </section>
    );
  }
  return null;
}

export function LiveInfoAfter({ slug, ctx }: { slug: string; ctx: LiveContext }) {
  if (slug !== "size-guide") return null;
  return (
    <>
      {ctx.sizeCharts.map((chart) => {
        const data = parseSizeChart(chart.columns, chart.rows);
        return data ? (
          <section key={chart.id}>
            <h2>{chart.name}</h2>
            <div className="not-prose">
              <SizeChartTable chart={data} notes={chart.notes} name={chart.name} />
            </div>
          </section>
        ) : null;
      })}
    </>
  );
}
