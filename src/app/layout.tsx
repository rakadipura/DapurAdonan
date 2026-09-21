import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/customer/SessionProvider";
import { VersionChecker } from "@/components/customer/VersionChecker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toko Mini Moni — Roti, Kue, dan Jajanan Sehat",
  description: "Toko Mini Moni menyediakan roti tawar, kue kering, ronde kue, dan minuman segar. Pesan untuk diambil atau dikirim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        <VersionChecker />
      </body>
    </html>
  );
}
