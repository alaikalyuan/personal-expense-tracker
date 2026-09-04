import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Viewport } from "next";
import BottomNav from "./BottomNav";
import { LanguageProvider } from "@/utils/i18n/context";
import { getLocaleServer } from "@/utils/i18n/server";
import { ThemeProvider } from "@/utils/theme/context";
import { getThemeServer } from "@/utils/theme/server";

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
  const [locale, theme] = await Promise.all([getLocaleServer(), getThemeServer()]);

  return (
    <html
      lang={locale}
      className={theme === "dark" ? "dark" : ""}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie.match(/(?:^|;\\s*)THEME=([^;]+)/);var t=c?c[1]:(localStorage.getItem('theme')||'dark');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased min-h-screen relative`}>
        <ThemeProvider initialTheme={theme}>
          <LanguageProvider initialLocale={locale}>
            {children}
            <BottomNav />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
