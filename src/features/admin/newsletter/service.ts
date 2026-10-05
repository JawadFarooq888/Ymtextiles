import "server-only";
import Papa from "papaparse";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const NEWSLETTER_PAGE_SIZE = 50;

export async function listSubscribers(q: string | undefined, page: number) {
  const where: Prisma.NewsletterSubscriberWhereInput = q
    ? { email: { contains: q, mode: "insensitive" } }
    : {};
  const [total, active, subscribers] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * NEWSLETTER_PAGE_SIZE,
      take: NEWSLETTER_PAGE_SIZE,
    }),
  ]);
  return {
    total,
    active,
    subscribers,
    pageCount: Math.max(1, Math.ceil(total / NEWSLETTER_PAGE_SIZE)),
  };
}

export function setUnsubscribed(id: string, unsubscribed: boolean) {
  return db.newsletterSubscriber.update({
    where: { id },
    data: { unsubscribedAt: unsubscribed ? new Date() : null },
  });
}

export function deleteSubscriber(id: string) {
  return db.newsletterSubscriber.delete({ where: { id } });
}

/** Active subscribers only, ready to import into an email tool. */
export async function exportSubscribersCsv() {
  const rows = await db.newsletterSubscriber.findMany({
    where: { unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return Papa.unparse({
    fields: ["email", "consent_given_at", "source", "signed_up_at"],
    data: rows.map((r) => [
      r.email,
      r.consentAt.toISOString(),
      r.source ?? "",
      r.createdAt.toISOString(),
    ]),
  });
}
