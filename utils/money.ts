export type SupportedCurrency = "IDR" | "USD" | "EUR" | "SGD" | "MYR" | "AUD";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimals: number;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", decimals: 0, flag: "🇮🇩" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2, flag: "🇺🇸" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2, flag: "🇪🇺" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", decimals: 2, flag: "🇸🇬" },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", decimals: 2, flag: "🇲🇾" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2, flag: "🇦🇺" },
};

export const CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES) as SupportedCurrency[];

export const DEFAULT_CURRENCY: SupportedCurrency = "IDR";

export function isSupportedCurrency(val: unknown): val is SupportedCurrency {
  return typeof val === "string" && val in SUPPORTED_CURRENCIES;
}

export interface FormatMoneyOptions {
  /** Force fixed fraction digits even for whole numbers (e.g. $50.00 instead of $50) */
  fixedDecimals?: boolean;
  /** Custom fraction digits override */
  fractionDigits?: number;
  /** Whether to omit the currency symbol prefix */
  noSymbol?: boolean;
  /** Compact format, e.g. 50k */
  compact?: boolean;
}

export function formatMoney(
  amount: number | string,
  currency: SupportedCurrency = DEFAULT_CURRENCY,
  options?: FormatMoneyOptions
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "-";

  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const isWhole = Number.isInteger(num);

  let fractionDigits = config.decimals;
  if (options?.fractionDigits !== undefined) {
    fractionDigits = options.fractionDigits;
  } else if (!options?.fixedDecimals && isWhole) {
    fractionDigits = 0;
  }

  // Locale for grouping separator
  const locale = currency === "IDR" ? "id-ID" : "en-US";

  const formattedNumber = Math.abs(num).toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  if (options?.noSymbol) {
    return num < 0 ? `-${formattedNumber}` : formattedNumber;
  }

  // Symbol spacing:
  // Rp and RM usually look best with a space (Rp 50.000, RM 50)
  // $, €, S$, A$ look standard either directly or with space ($50, €50, S$50, A$50)
  const symbol = config.symbol;
  const needsSpace = symbol === "Rp" || symbol === "RM";
  const symbolPrefix = needsSpace ? `${symbol} ` : symbol;

  if (num < 0) {
    return `-${symbolPrefix}${formattedNumber}`;
  }
  return `${symbolPrefix}${formattedNumber}`;
}

export function getCurrencySymbol(currency: SupportedCurrency = DEFAULT_CURRENCY): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || "Rp";
}
