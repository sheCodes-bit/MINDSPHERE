import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { BRAND_CONFIG } from "@/config/branding";

export const metadata: Metadata = {
  title: {
    default: `${BRAND_CONFIG.name} — ${BRAND_CONFIG.subtitle}`,
    template: `%s | ${BRAND_CONFIG.name}`,
  },
  description: BRAND_CONFIG.fullDescription,
  keywords: [
    BRAND_CONFIG.name,
    "COMSATS VSPARK Quiz Competition",
    "COMSATS University Islamabad",
    "university computing competition",
    "CS quiz competition",
    "programming challenge",
    "computer science competition",
    "algorithmic competition",
  ],
  openGraph: {
    type: "website",
    locale: BRAND_CONFIG.locale,
    title: `${BRAND_CONFIG.name} — ${BRAND_CONFIG.subtitle}`,
    description: BRAND_CONFIG.tagline,
    siteName: BRAND_CONFIG.name,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased bg-deep text-slate-900 min-h-screen selection:bg-blue-600/20 selection:text-slate-900">
        <div className="relative min-h-screen">
          {children}
        </div>
        <Toaster position="top-right" richColors theme="light" />
      </body>
    </html>
  );
}
