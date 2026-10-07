/**
 * Starting text for the information pages. Seeded into the Page table, where the
 * owner edits it in Admin → Pages. Also used as a fallback if a row is missing.
 * Live values (fees, returns days, WhatsApp, email, size charts) are added by the
 * page itself, so they never go out of date.
 */
export interface DefaultPage {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
  sortOrder: number;
}

const REVIEW = "**[TO BE REVIEWED BY OWNER]**";

export const SYSTEM_PAGES: DefaultPage[] = [
  {
    slug: "size-guide",
    title: "Size Guide",
    metaDescription:
      "How to find your jeans size: waist, length and fit, in inches and centimetres.",
    sortOrder: 1,
    body: `Our jeans are sized by **waist** and **length** in inches, for example **W32 L30**. If you are between sizes or unsure, message us on WhatsApp and we will help you choose.

## How to measure

- **Waist:** measure around your natural waist, where you usually wear your jeans. Keep the tape snug but not tight.
- **Length (inside leg):** measure from the top of your inner thigh down to where you want the hem, ideally with shoes off.
- **Hip:** around the fullest part of your hips.
- **Easiest way:** lay a pair of jeans that fits you well flat, and measure across the waistband (double it) and along the inside leg seam.

## Fits

- **Skinny / Slim:** close fit through the hip and leg.
- **Straight / Regular:** the same width from knee to hem.
- **Relaxed / Wide leg / Baggy:** more room through the leg.

Kids jeans are sized by age. Check the chart for each age group.`,
  },
  {
    slug: "delivery-returns",
    title: "Delivery & Returns",
    metaDescription: "UK delivery options and our 14-day returns policy.",
    sortOrder: 2,
    body: `## Returns

Under the UK Consumer Contracts Regulations you can cancel your order within the returns period shown above, without giving a reason. You then have a further 14 days to send the items back. We will refund you within 14 days of receiving the items, including the standard delivery cost you paid.

To start a return, contact us on WhatsApp or by email with your order number.

Return address, who pays return postage, and any conditions on items: ${REVIEW}

Faulty or incorrect items: your statutory rights under the Consumer Rights Act 2015 are not affected.`,
  },
  {
    slug: "about",
    title: "About YM Textiles",
    metaDescription: "Jeans for men, women and kids, stocked in the UK.",
    sortOrder: 3,
    body: `YM Textiles sells jeans for men, women and kids across the United Kingdom, in every fit from skinny to wide leg.

Our story, who we are and how we choose our denim: **[TO BE REVIEWED BY OWNER]**`,
  },
  {
    slug: "contact",
    title: "Contact Us",
    metaDescription: "Get in touch with YM Textiles on WhatsApp or by email.",
    sortOrder: 4,
    body: `The quickest way to reach us is WhatsApp. We can help with sizing, fit, washes, orders and delivery.

Opening hours for replies: **[TO BE REVIEWED BY OWNER]**`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    metaDescription: "How YM Textiles collects and uses your personal data.",
    sortOrder: 5,
    body: `${REVIEW} This is placeholder text and must be reviewed before the site goes live.

## What we collect

When you order we collect your name, contact details and delivery address. Card payments are processed by Stripe; we do not see or store your full card details. If you order on WhatsApp, your messages are handled by WhatsApp (Meta). If you join our newsletter we store your email address and when you agreed to receive emails.

## Why we use it

To process and deliver your order, to reply to your questions, and (only with your consent) to send marketing emails.

## Cookies

See our [Cookie Policy](/pages/cookie-policy).

## Your rights

Under UK GDPR you can ask for a copy of your data, ask us to correct or delete it, and unsubscribe from marketing at any time. You can also complain to the Information Commissioner's Office ([ico.org.uk](https://ico.org.uk)).

Data controller name, address, contact and retention periods: ${REVIEW}`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    metaDescription: "The terms that apply when you buy from YM Textiles.",
    sortOrder: 6,
    body: `${REVIEW} This is placeholder text and must be reviewed before the site goes live.

## Prices

All prices are in pounds sterling (GBP) and include VAT. Delivery charges are shown before you pay.

## Orders

Website orders are confirmed when payment succeeds. WhatsApp orders are confirmed when we reply to confirm availability and payment.

## Cancellations and returns

See [Delivery & Returns](/pages/delivery-returns).

Business name, address and company details: ${REVIEW}`,
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    metaDescription: "How YM Textiles uses cookies.",
    sortOrder: 7,
    body: `${REVIEW} This is placeholder text and must be reviewed before the site goes live.

## Essential

Needed for the site to work, such as remembering your basket (stored in your browser) and keeping staff signed in to the admin area.

## Analytics (optional)

Only used if you accept them in the cookie banner. They help us understand which pages are useful.`,
  },
];

export const SYSTEM_PAGE_SLUGS = new Set(SYSTEM_PAGES.map((p) => p.slug));

export const DEFAULT_WHY_US = [
  { title: "Every fit", text: "Skinny, slim, straight, relaxed and wide leg." },
  { title: "Stocked in the UK", text: "Already here, so it reaches you quickly." },
  {
    title: "Waist and length",
    text: "Choose your exact W and L size, with a size chart for every style.",
  },
  { title: "Help on WhatsApp", text: "Ask about fit, size or delivery and get a real reply." },
];
