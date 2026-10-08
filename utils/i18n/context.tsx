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
import {
  SupportedCurrency,
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrencySymbol,
  FormatMoneyOptions,
} from "@/utils/money";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  currencySymbol: string;
  t: Dictionary;
  formatDate: (date: Date | string | number, formatStr: string) => string;
  formatCurrency: (amount: number, options?: FormatMoneyOptions) => string;
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
  initialCurrency = DEFAULT_CURRENCY,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialCurrency?: SupportedCurrency;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [currency, setCurrencyState] = useState<SupportedCurrency>(initialCurrency);
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

  const setCurrency = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    // Set cookie for 1 year
    document.cookie = `NEXT_CURRENCY=${newCurrency}; path=/; max-age=31536000; SameSite=Lax`;
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

  const formatCurrency = (amount: number, options?: FormatMoneyOptions) => {
    return formatMoney(amount, currency, options);
  };

  const currencySymbol = getCurrencySymbol(currency);

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
        currency,
        setCurrency,
        currencySymbol,
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
