"use client";

import React, { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format as formatFns, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";
import { enUS as enLocale } from "date-fns/locale/en-US";
import {
  dictionaries,
  Dictionary,
  Locale,
  CategoryKey,
} from "./dictionaries";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  formatDate: (date: Date | string | number, formatStr: string) => string;
  formatCurrency: (amount: number) => string;
  getCategoryLabel: (category: string) => string;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dateLocales = {
  id: idLocale,
  en: enLocale,
};

export function LanguageProvider({
  children,
  initialLocale = "id",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Set cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  const t = dictionaries[locale] || dictionaries.id;

  const formatDate = (date: Date | string | number, formatStr: string) => {
    try {
      const parsedDate =
        typeof date === "string" ? parseISO(date) : new Date(date);
      return formatFns(parsedDate, formatStr, {
        locale: dateLocales[locale],
      });
    } catch {
      return String(date);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
  };

  const getCategoryLabel = (category: string) => {
    if (!category) return t.common.none;
    if (category in t.categories) {
      return t.categories[category as CategoryKey];
    }
    return category;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatDate,
        formatCurrency,
        getCategoryLabel,
        isPending,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
