import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import type { Viewport } from "next";
import BottomNav from "./BottomNav";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import { LanguageProvider } from "@/utils/i18n/context";
import { getLocaleServer, getCurrencyServer } from "@/utils/i18n/server";
import { ThemeProvider } from "@/utils/theme/context";
import { getThemeServer, getPaletteServer } from "@/utils/theme/server";
import { PAPER, THEME_BOOT_SCRIPT } from "@/utils/theme/palette";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SakuTrack : Student Budget Tracker",
  description: "Track weekly college and personal expenses",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SakuTrack : Student Budget Tracker",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const [theme, palette] = await Promise.all([getThemeServer(), getPaletteServer()]);
  // Hybrid depends on the visitor's clock; the client corrects the color after load.
  return {
    themeColor: PAPER[palette === "hybrid" ? "orange" : palette][theme],
    width: "device-width",
    initialScale: 1,
  };
}

import { cookies } from "next/headers";
import { FEATURE_MULTI_SAKU_ENABLED } from "@/utils/wallets/config";
import { AiAssistantProvider } from "@/app/ai/AiAssistantProvider";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const multiSakuEnabled =
    FEATURE_MULTI_SAKU_ENABLED && cookieStore.get("MULTI_SAKU_ENABLED")?.value === "true";
  const aiModeEnabled = cookieStore.get("AI_MODE_ENABLED")?.value !== "false";
  const signedIn = cookieStore.getAll().some((cookie) => cookie.name.includes("-auth-token"));

  const [locale, theme, palette, currency] = await Promise.all([
    getLocaleServer(),
    getThemeServer(),
    getPaletteServer(),
    getCurrencyServer(),
  ]);

  return (
    <html
      lang={locale}
      className={theme === "dark" ? "dark" : ""}
      style={{ colorScheme: theme }}
      data-palette={palette === "orange" || palette === "hybrid" ? undefined : palette}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className={`${jakarta.variable} font-sans bg-paper text-ink antialiased min-h-screen relative`}>
        <ThemeProvider initialTheme={theme} initialPalette={palette}>
          <LanguageProvider initialLocale={locale} initialCurrency={currency}>
            <AiAssistantProvider initialAiEnabled={aiModeEnabled}>
              <ServiceWorkerRegister />
              {children}
              <BottomNav initialMultiSaku={multiSakuEnabled} signedIn={signedIn} />
            </AiAssistantProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
