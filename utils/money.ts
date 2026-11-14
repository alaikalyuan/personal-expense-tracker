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

// ---------------------------------------------------------------------------
// Parsing typed money amounts
// ---------------------------------------------------------------------------

export type MoneyParseResult = { ok: true; value: number } | { ok: false; error: string };

export interface ParseMoneyOptions {
  /** An empty field parses as 0 instead of failing. */
  allowEmpty?: boolean;
  /** Accept 0 as a value. */
  allowZero?: boolean;
  /** Inclusive upper bound, for example the balance that can be withdrawn. */
  max?: number;
  /** Message used when the value is above `max`. */
  maxError?: string;
}

/** Largest amount any money field accepts (Rp 999.999.999.999). */
export const MONEY_INPUT_MAX = 999_999_999_999;

export const MONEY_ERRORS = {
  empty: "Nominal wajib diisi.",
  negative: "Nominal tidak boleh negatif.",
  zero: "Nominal harus lebih dari 0.",
  decimalComma: "Rupiah tidak pakai desimal. Hapus angka di belakang koma.",
  commaGrouping: "Gunakan titik untuk ribuan, contoh 2.000.000.",
  grouping: "Titik ribuan tidak pas, contoh yang benar 2.000.000.",
  notNumber: "Nominal hanya boleh berisi angka, contoh 2.000.000.",
  tooLarge: "Nominal terlalu besar.",
} as const;

/** Groups the digits of a whole number with dots: 2000000 → "2.000.000". */
export function formatRupiahInput(value: number): string {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function checkBounds(value: number, opts: ParseMoneyOptions, symbol: string): MoneyParseResult {
  if (value > MONEY_INPUT_MAX) return { ok: false, error: MONEY_ERRORS.tooLarge };
  if (value === 0 && !opts.allowZero) return { ok: false, error: MONEY_ERRORS.zero };
  if (opts.max !== undefined && value > opts.max) {
    const limit = Math.max(0, opts.max);
    return {
      ok: false,
      error: opts.maxError ?? `Nominal melebihi batas ${symbol} ${formatRupiahInput(limit)}.`,
    };
  }
  return { ok: true, value };
}

function emptyResult(opts: ParseMoneyOptions, symbol: string): MoneyParseResult {
  return opts.allowEmpty ? checkBounds(0, { ...opts, allowZero: true }, symbol) : { ok: false, error: MONEY_ERRORS.empty };
}

/**
 * Parses a rupiah amount typed by a person.
 *
 * Accepts "2000000", "2.000.000" and "Rp 2.000.000". Rejects decimals
 * ("15.000,50"), negatives, letters and exponent forms ("1e5").
 */
export function parseRupiahInput(raw: string, opts: ParseMoneyOptions = {}): MoneyParseResult {
  let s = raw.trim();
  if (!s) return emptyResult(opts, "Rp");

  if (s.startsWith("-")) return { ok: false, error: MONEY_ERRORS.negative };
  s = s.replace(/^rp\.?\s*/i, "");
  if (s.startsWith("-")) return { ok: false, error: MONEY_ERRORS.negative };

  if (s.includes(",")) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) return { ok: false, error: MONEY_ERRORS.commaGrouping };
    return { ok: false, error: MONEY_ERRORS.decimalComma };
  }
  if (!/^[\d.]+$/.test(s)) return { ok: false, error: MONEY_ERRORS.notNumber };
  if (s.includes(".") && !/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return { ok: false, error: MONEY_ERRORS.grouping };
  }

  return checkBounds(Number(s.replace(/\./g, "")), opts, "Rp");
}

/**
 * Parses an amount in the given currency. Rupiah goes through
 * `parseRupiahInput`; other currencies accept "1,234.56"-style input
 * with at most the currency's number of decimals.
 */
export function parseMoneyInput(
  raw: string,
  currency: SupportedCurrency = DEFAULT_CURRENCY,
  opts: ParseMoneyOptions = {}
): MoneyParseResult {
  if (currency === "IDR") return parseRupiahInput(raw, opts);

  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  let s = raw.trim();
  if (!s) return emptyResult(opts, config.symbol);

  if (s.startsWith("-")) return { ok: false, error: MONEY_ERRORS.negative };
  if (s.toLowerCase().startsWith(config.symbol.toLowerCase())) s = s.slice(config.symbol.length).trim();
  if (s.startsWith("-")) return { ok: false, error: MONEY_ERRORS.negative };

  if (!/^[\d.,]+$/.test(s)) return { ok: false, error: MONEY_ERRORS.notNumber };
  if (s.includes(",")) {
    if (!/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
      return { ok: false, error: "Gunakan titik untuk desimal, contoh 9.99." };
    }
    s = s.replace(/,/g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: MONEY_ERRORS.notNumber };

  const decimals = s.split(".")[1]?.length ?? 0;
  if (decimals > config.decimals) {
    return { ok: false, error: `Maksimal ${config.decimals} angka di belakang titik.` };
  }

  return checkBounds(Number(s), opts, config.symbol);
}

/**
 * Server-side check for a rupiah amount sent by a client: a FormData
 * string goes through `parseRupiahInput`, a number must be a finite whole
 * number. Anything else is rejected.
 */
export function parseRupiahAmount(input: unknown, opts: ParseMoneyOptions = {}): MoneyParseResult {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return { ok: false, error: MONEY_ERRORS.notNumber };
    if (input < 0) return { ok: false, error: MONEY_ERRORS.negative };
    if (!Number.isInteger(input)) return { ok: false, error: MONEY_ERRORS.decimalComma };
    return checkBounds(input, opts, "Rp");
  }
  if (typeof input === "string") return parseRupiahInput(input, opts);
  if (input === null || input === undefined) return emptyResult(opts, "Rp");
  return { ok: false, error: MONEY_ERRORS.notNumber };
}
