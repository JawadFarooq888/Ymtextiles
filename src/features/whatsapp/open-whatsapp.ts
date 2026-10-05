"use client";

import type { ActionResult } from "@/features/admin/action-result";

/**
 * Run a server action that returns a wa.me URL, then open WhatsApp.
 *
 * Browsers block pop-ups opened after an `await`, so on desktop we open an empty
 * tab synchronously (inside the click) and point it at WhatsApp once the order
 * exists. On phones we navigate the current tab, which hands over to the
 * WhatsApp app and leaves the shop page in the browser history.
 */
export async function openWhatsAppAfter<T extends { url: string }>(
  action: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const tab = isTouch ? null : window.open("about:blank", "_blank");
  if (tab) {
    tab.document.title = "Opening WhatsApp…";
    tab.document.body.textContent = "Opening WhatsApp…";
  }

  const result = await action();
  if (!result.ok) {
    tab?.close();
    return result;
  }
  if (tab) {
    tab.opener = null;
    tab.location.href = result.data.url;
  } else {
    window.location.href = result.data.url;
  }
  return result;
}
