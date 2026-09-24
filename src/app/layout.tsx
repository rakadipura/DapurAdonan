import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/customer/SessionProvider";
import { VersionChecker } from "@/components/customer/VersionChecker";
import { getCustomerFacingSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Toko Mini Moni — Roti, Kue, dan Jajanan Sehat",
    template: "%s | Toko Mini Moni",
  },
  description: "Toko Mini Moni menyediakan roti tawar, kue kering, ronde kue, dan minuman segar. Pesan untuk diambil atau dikirim.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCustomerFacingSettings();
  
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={settings.faviconUrl} sizes="any" />
        <link rel="apple-touch-icon" href={settings.logoUrl} />
        <meta name="theme-color" content="#A0522D" />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        <VersionChecker />
      </body>
    </html>
  );
}
