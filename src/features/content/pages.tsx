import Link from "next/link";
import { z } from "zod";
import type { Settings } from "@prisma/client";
import { SizeChartTable } from "@/features/product/components/size-chart-dialog";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";
import { formatPence } from "@/lib/money";

export interface ContentContext {
  settings: Settings;
  sizeCharts: { id: string; name: string; rows: unknown; notes: string | null }[];
}

interface ContentPage {
  title: string;
  description: string;
  render: (ctx: ContentContext) => React.ReactNode;
}

const REVIEW = <strong className="text-brand-sale">[TO BE REVIEWED BY OWNER]</strong>;
const CONFIRM = <strong className="text-brand-sale">[TO BE CONFIRMED BY OWNER]</strong>;

const chartRows = z.array(
  z.object({
    size: z.string(),
    chest: z.number(),
    length: z.number(),
    sleeve: z.number(),
    trouserLength: z.number(),
  }),
);

export const CONTENT_PAGES: Record<string, ContentPage> = {
  "size-guide": {
    title: "Size Guide",
    description: "Measurements for our stitched clothing in inches and centimetres.",
    render: ({ sizeCharts, settings }) => (
      <>
        <p>
          All measurements are of the garment itself. If you are between sizes or unsure, message us
          on WhatsApp and we will help you choose.
        </p>
        <h2>How to measure</h2>
        <ul>
          <li>
            <strong>Chest:</strong> around the fullest part of the chest, under the arms.
          </li>
          <li>
            <strong>Length:</strong> from the highest point of the shoulder down to the hem.
          </li>
          <li>
            <strong>Sleeve:</strong> from the shoulder seam to the end of the sleeve.
          </li>
          <li>
            <strong>Shalwar / trouser:</strong> from the waist down to the hem.
          </li>
        </ul>
        {sizeCharts.map((chart) => {
          const rows = chartRows.safeParse(chart.rows);
          return rows.success && rows.data.length ? (
            <section key={chart.id}>
              <h2>{chart.name}</h2>
              <div className="not-prose">
                <SizeChartTable rows={rows.data} notes={chart.notes} name={chart.name} />
              </div>
            </section>
          ) : null;
        })}
        <p>
          Unstitched suits come as fabric for you to have tailored to your own measurements.{" "}
          <a
            href={buildWhatsAppUrl(settings.whatsappNumber, "Hi, I have a question about sizing.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask us about sizing on WhatsApp
          </a>
          .
        </p>
      </>
    ),
  },
  "delivery-returns": {
    title: "Delivery & Returns",
    description: "UK delivery options and our 14-day returns policy.",
    render: ({ settings }) => (
      <>
        <h2>Delivery (UK only)</h2>
        <ul>
          <li>
            Standard delivery: {formatPence(settings.standardDeliveryFee)}
            {settings.freeDeliveryThreshold > 0
              ? `. Free on orders over ${formatPence(settings.freeDeliveryThreshold)}.`
              : "."}
          </li>
          <li>Express delivery: {formatPence(settings.expressDeliveryFee)}.</li>
          <li>Dispatch and delivery times: {CONFIRM}</li>
        </ul>
        <h2>Returns</h2>
        <p>
          Under the UK Consumer Contracts Regulations you can cancel your order within{" "}
          {settings.returnsDays} days of receiving it, without giving a reason. You then have a
          further 14 days to send the items back. We will refund you within 14 days of receiving the
          items, including the standard delivery cost you paid.
        </p>
        <p>To start a return, contact us on WhatsApp or by email with your order number.</p>
        <p>Return address, who pays return postage, and any conditions on items: {REVIEW}</p>
        <p>
          Faulty or incorrect items: your statutory rights under the Consumer Rights Act 2015 are
          not affected.
        </p>
      </>
    ),
  },
  about: {
    title: "About YM Textiles",
    description: "Pakistani clothing, sourced in Pakistan and stocked in the UK.",
    render: () => (
      <>
        <p>
          YM Textiles brings Pakistani clothing to customers across the United Kingdom: lawn suits,
          ready to wear, unstitched fabric, formal and wedding wear, and menswear.
        </p>
        <p>Our story, who we are and how we choose our collections: {REVIEW}</p>
      </>
    ),
  },
  contact: {
    title: "Contact Us",
    description: "Get in touch with YM Textiles on WhatsApp or by email.",
    render: ({ settings }) => (
      <>
        <p>
          The quickest way to reach us is WhatsApp. We can help with sizing, fabric, orders and
          delivery.
        </p>
        <p className="not-prose">
          <a
            href={buildWhatsAppUrl(settings.whatsappNumber, "Hi YM Textiles, I have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground"
          >
            Chat on WhatsApp
          </a>
        </p>
        <ul>
          <li>
            Email:{" "}
            {settings.contactEmail ? (
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            ) : (
              CONFIRM
            )}
          </li>
          <li>Address: {settings.businessAddress ?? CONFIRM}</li>
          <li>Opening hours for replies: {CONFIRM}</li>
        </ul>
      </>
    ),
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description: "How YM Textiles collects and uses your personal data.",
    render: () => (
      <>
        <p>{REVIEW} This is placeholder text and must be reviewed before the site goes live.</p>
        <h2>What we collect</h2>
        <p>
          When you order we collect your name, contact details and delivery address. Card payments
          are processed by Stripe; we do not see or store your full card details. If you order on
          WhatsApp, your messages are handled by WhatsApp (Meta). If you join our newsletter we
          store your email address and when you agreed to receive emails.
        </p>
        <h2>Why we use it</h2>
        <p>
          To process and deliver your order, to reply to your questions, and (only with your
          consent) to send marketing emails.
        </p>
        <h2>Cookies</h2>
        <p>
          See our <Link href="/pages/cookie-policy">Cookie Policy</Link>.
        </p>
        <h2>Your rights</h2>
        <p>
          Under UK GDPR you can ask for a copy of your data, ask us to correct or delete it, and
          unsubscribe from marketing at any time. You can also complain to the Information
          Commissioner&apos;s Office (ico.org.uk).
        </p>
        <p>Data controller name, address, contact and retention periods: {REVIEW}</p>
      </>
    ),
  },
  terms: {
    title: "Terms & Conditions",
    description: "The terms that apply when you buy from YM Textiles.",
    render: ({ settings }) => (
      <>
        <p>{REVIEW} This is placeholder text and must be reviewed before the site goes live.</p>
        <h2>Prices</h2>
        <p>
          All prices are in pounds sterling (GBP) and include VAT. Delivery charges are shown before
          you pay.
        </p>
        <h2>Orders</h2>
        <p>
          Website orders are confirmed when payment succeeds. WhatsApp orders are confirmed when we
          reply to confirm availability and payment.
        </p>
        <h2>Cancellations and returns</h2>
        <p>
          You can cancel within {settings.returnsDays} days of delivery. See{" "}
          <Link href="/pages/delivery-returns">Delivery &amp; Returns</Link>.
        </p>
        <p>Business name, address and company details: {REVIEW}</p>
      </>
    ),
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description: "How YM Textiles uses cookies.",
    render: () => (
      <>
        <p>{REVIEW} This is placeholder text and must be reviewed before the site goes live.</p>
        <h2>Essential</h2>
        <p>
          Needed for the site to work, such as remembering your basket (stored in your browser) and
          keeping staff signed in to the admin area.
        </p>
        <h2>Analytics (optional)</h2>
        <p>
          Only used if you accept them in the cookie banner. They help us understand which pages are
          useful.
        </p>
        <p>You can change your choice at any time from the link in the footer.</p>
      </>
    ),
  },
};
