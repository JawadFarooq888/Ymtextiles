import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "YM Textiles | Pakistani Clothing in the UK",
    template: "%s | YM Textiles",
  },
  description:
    "Lawn suits, ready to wear, unstitched fabric, formal and wedding wear, and menswear. Sourced in Pakistan, stocked in the UK.",
};

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
