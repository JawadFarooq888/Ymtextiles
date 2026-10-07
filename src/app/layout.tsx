import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: settings.seoTitle, template: `%s | ${settings.storeName}` },
    description: settings.seoDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="text-brand-body antialiased">{children}</body>
    </html>
  );
}
