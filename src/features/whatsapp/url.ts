/**
 * wa.me link that opens WhatsApp (app on mobile, web on desktop) with an optional
 * pre-filled message. `number` is international format digits, e.g. 447123456789.
 */
export function buildWhatsAppUrl(number: string, message?: string): string {
  const digits = number.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
