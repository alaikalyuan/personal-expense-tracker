import { cookies } from "next/headers";
import { format as formatFns, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";
import { enUS as enLocale } from "date-fns/locale/en-US";
import {
  dictionaries,
  Dictionary,
  Locale,
  CategoryKey,
} from "./dictionaries";

const dateLocales = {
  id: idLocale,
  en: enLocale,
};

export async function getLocaleServer(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (localeCookie === "en" || localeCookie === "id") {
    return localeCookie;
  }
  return "id";
}

export async function getDictionaryServer(
  explicitLocale?: Locale
): Promise<{ t: Dictionary; locale: Locale }> {
  const locale = explicitLocale || (await getLocaleServer());
  return {
    t: dictionaries[locale] || dictionaries.id,
    locale,
  };
}

export function formatDateServer(
  date: Date | string | number,
  formatStr: string,
  locale: Locale = "id"
): string {
  try {
    const parsedDate =
      typeof date === "string" ? parseISO(date) : new Date(date);
    return formatFns(parsedDate, formatStr, {
      locale: dateLocales[locale],
    });
  } catch {
    return String(date);
  }
}

export function formatCurrencyServer(amount: number): string {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

export function getCategoryLabelServer(
  category: string,
  locale: Locale = "id"
): string {
  if (!category) return dictionaries[locale].common.none;
  const t = dictionaries[locale] || dictionaries.id;
  if (category in t.categories) {
    return t.categories[category as CategoryKey];
  }
  return category;
}

