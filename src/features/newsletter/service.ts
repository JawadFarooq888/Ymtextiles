import "server-only";
import { db } from "@/lib/db";

/** Subscribe (or re-subscribe) an email, recording when consent was given. */
export async function subscribe(email: string, source?: string) {
  const now = new Date();
  await db.newsletterSubscriber.upsert({
    where: { email },
    update: { consentAt: now, unsubscribedAt: null, source },
    create: { email, consentAt: now, source },
  });
}
