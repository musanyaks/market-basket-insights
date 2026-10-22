import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BasketIQ — Market Basket Insights",
  description:
    "Advanced association-rule mining for retail. Discover product bundles, cross-sell opportunities, and shelf-placement recommendations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
