"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";

/** Pages can set a more specific pre-filled message (e.g. the product page). */
const useFloatingMessage = create<{ message: string | null; path: string | null }>(() => ({
  message: null,
  path: null,
}));

export function SetFloatingWhatsAppMessage({ message }: { message: string }) {
  const pathname = usePathname();
  useEffect(() => {
    useFloatingMessage.setState({ message, path: pathname });
    return () => useFloatingMessage.setState({ message: null, path: null });
  }, [message, pathname]);
  return null;
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.96 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.13-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.32-2.9c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.74 2.74 0 0 0-.86 2.04 4.76 4.76 0 0 0 1 2.53 10.9 10.9 0 0 0 4.17 3.69c1.55.67 2.16.73 2.94.61.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.15-1.18-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function FloatingWhatsApp({
  number,
  defaultMessage,
}: {
  number: string;
  defaultMessage: string;
}) {
  const pathname = usePathname();
  const { message, path } = useFloatingMessage();
  const text = message && path === pathname ? message : defaultMessage;

  return (
    <aside aria-label="WhatsApp chat">
      <a
        href={buildWhatsAppUrl(number, text)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed right-3 bottom-3 z-40 flex size-12 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-lg ring-4 ring-white/70 transition hover:scale-105 hover:bg-[#178347] focus-visible:outline-offset-4 md:right-6 md:bottom-6 md:size-14"
      >
        <WhatsAppGlyph />
      </a>
    </aside>
  );
}
