import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Viewport } from "next";
import BottomNav from "./BottomNav";
import { LanguageProvider } from "@/utils/i18n/context";
import { getLocaleServer } from "@/utils/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Expense Tracker",
  description: "Track weekly college and personal expenses",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expenses",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents unwanted auto-zoom on mobile text inputs
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleServer();

  return (
    <html lang={locale} className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-zinc-950 text-zinc-100 antialiased min-h-screen relative`}>
        <LanguageProvider initialLocale={locale}>
          {children}
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
