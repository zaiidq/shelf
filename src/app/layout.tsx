import type { Metadata, Viewport } from "next";
import { Anton, Geist } from "next/font/google";

import { siteUrl } from "@/lib/env";

import "./globals.css";

// Display face: names, section titles, poster titles (uppercase).
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

// Everything else.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shelf",
    template: "%s · Shelf",
  },
  description: "Show who you are through what you love.",
};

export const viewport: Viewport = {
  themeColor: "#0E0E10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anton.variable} ${geist.variable} antialiased`}>
      <body className="min-h-dvh bg-background text-fg">{children}</body>
    </html>
  );
}
