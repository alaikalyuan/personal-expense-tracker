import type { CategoryKey } from "./i18n/dictionaries";
import type { QuickChip } from "./quickChips";
import type { SupportedCurrency } from "./money";
import { addDays, subDays, addWeeks, subWeeks, startOfWeek, format, parseISO, getDate, getMonth, setDate, setMonth } from "date-fns";

export interface WalletOption {
  id: string;
  name: string;
}

export interface ParsedExpense {
  isValid: boolean;
  name: string;
  amount: number | null;
  category: CategoryKey;
  spentAt: string;
  isExempt?: boolean;
  matchedAmountText?: string;
  walletId?: string | null;
  matchedWalletName?: string;
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  // Indonesian
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
  minggu: 7,
  ahad: 7,

  // English
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,

  // English abbreviations
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

const DAY_NAMES_PATTERN =
  "senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|ahad|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun";

const prefixDayRegex = new RegExp(
  `\\b(?:(?:pada|di|pas|on)\\s+)?(?:hari\\s+)?(last\\s+week|last|this\\s+week|this|next\\s+week|next|kemarin)\\s+(${DAY_NAMES_PATTERN})\\b`,
  "i"
);

const suffixDayRegex = new RegExp(
  `\\b(?:(?:pada|di|pas|on)\\s+)?(?:hari\\s+)?(${DAY_NAMES_PATTERN})(?:\\s+(minggu\\s+lalu|minggu\\s+depan|minggu\\s+ini|last\\s+week|next\\s+week|this\\s+week|kemarin|lalu|depan|ini|last|next|this))?\\b`,
  "i"
);

// High-specificity multi-word phrases checked before single words
const MULTI_WORD_CATEGORY_KEYWORDS: { pattern: RegExp; category: CategoryKey }[] = [
  { pattern: /\b(?:makan\s+(?:siang|malam|pagi)|sarapan\s+pagi)\b/i, category: "Food & Dining" },
  { pattern: /\b(?:nasi\s+(?:padang|goreng|uduk|kuning|liwet|campur|bakar)|ayam\s+(?:geprek|bakar|goreng|penyet|crispy)|mie\s+(?:ayam|goreng|rebus|kuah)|bakso\s+(?:urat|telur|aci)|roti\s+bakar|es\s+teh|air\s+mineral|jus\s+buah|kopi\s+kenangan|janji\s+jiwa)\b/i, category: "Food & Dining" },
  { pattern: /\b(?:tiket\s+(?:kereta|pesawat|bus|kapal)|commuter\s+line|trans\s*jakarta|ojek\s+online|cuci\s+(?:motor|mobil)|tambal\s+ban|ganti\s+oli)\b/i, category: "Transportation" },
  { pattern: /\b(?:air\s+pdam|tagihan\s+listrik|token\s+listrik|pulsa\s+hp|paket\s+data|wifi\s+rumah|cuci\s+baju|gas\s+(?:elpiji|lpg))\b/i, category: "Utilities" },
  { pattern: /\b(?:alat\s+tulis|uang\s+(?:kuliah|semester|spp)|buku\s+tulis|buku\s+pelajaran)\b/i, category: "Academics" },
  { pattern: /\b(?:cinema\s+xxi|top\s*up\s*(?:game|diamond|mlbb|steam)|voucher\s+game)\b/i, category: "Entertainment" },
];

// Single word keywords with strict word boundaries
const CATEGORY_KEYWORDS: Record<Exclude<CategoryKey, "Others">, string[]> = {
  "Food & Dining": [
    "makan", "minum", "kopi", "coffee", "snack", "snacks", "sarapan", "lunch", "dinner",
    "breakfast", "meal", "drink", "beverage", "ayam", "nasi", "mie", "bakso", "cafe",
    "kafe", "food", "warung", "warteg", "warmindo", "kantin", "canteen", "resto",
    "restaurant", "burger", "pizza", "tea", "teh", "roti", "jus", "juice", "boba",
    "jajan", "martabak", "sate", "pecel", "soto", "padang", "geprek", "sushi", "cemilan",
    "gofood", "grabfood", "shopeefood", "indomaret", "alfamart", "buah", "sayur",
    "donat", "seblak", "gorengan", "batagor", "siomay", "dimsum", "telur", "indomie",
    "popmie", "sarimi"
  ],
  Transportation: [
    "bensin", "pertalite", "pertamax", "solar", "shell", "fuel", "gasoline", "gojek",
    "goride", "gocar", "grab", "grabbike", "grabcar", "maxim", "indrive", "ojol",
    "angkot", "parkir", "parking", "tol", "toll", "e-toll", "etoll", "kereta", "train",
    "mrt", "lrt", "krl", "commuter", "bus", "busway", "taksi", "taxi", "transport",
    "transportasi", "jaklingko", "bagasi", "flight", "pesawat"
  ],
  Utilities: [
    "listrik", "pln", "token", "pdam", "wifi", "internet", "indihome", "biznet",
    "kuota", "pulsa", "laundry", "loundry", "kos", "kost", "kontrakan", "sabun",
    "shampoo", "galon", "aqua", "gas", "elpiji", "lpg", "bpjs", "bill", "tagihan",
    "electricity"
  ],
  Academics: [
    "buku", "print", "ngeprint", "fotokopi", "fotocopy", "photocopy", "kursus",
    "kuliah", "spp", "ukt", "atk", "stationery", "seminar", "skripsi", "tugas",
    "modul", "kampus", "ukm", "book", "books", "study", "tuition", "pen", "pensil",
    "ujian"
  ],
  Entertainment: [
    "nonton", "bioskop", "cinema", "xxi", "cgv", "cinepolis", "movie", "film",
    "game", "games", "gaming", "steam", "playstation", "nintendo", "spotify",
    "netflix", "youtube", "jalan", "liburan", "holiday", "karaoke", "billiard",
    "biliar", "rekreasi", "diamond", "mlbb", "pubg", "valorant", "genshin", "roblox",
    "concert", "konser"
  ],
};

// Compiled regexes for word-boundary matching
const CATEGORY_REGEXES: Record<Exclude<CategoryKey, "Others">, RegExp> = {
  "Food & Dining": new RegExp(`\\b(?:${CATEGORY_KEYWORDS["Food & Dining"].join("|")})\\b`, "i"),
  Transportation: new RegExp(`\\b(?:${CATEGORY_KEYWORDS.Transportation.join("|")})\\b`, "i"),
  Utilities: new RegExp(`\\b(?:${CATEGORY_KEYWORDS.Utilities.join("|")})\\b`, "i"),
  Academics: new RegExp(`\\b(?:${CATEGORY_KEYWORDS.Academics.join("|")})\\b`, "i"),
  Entertainment: new RegExp(`\\b(?:${CATEGORY_KEYWORDS.Entertainment.join("|")})\\b`, "i"),
};

export function parseQuickExpenseInput(
  input: string,
  todayStr: string,
  customChips: QuickChip[] = [],
  currency: SupportedCurrency = "IDR",
  wallets: WalletOption[] = []
): ParsedExpense {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      name: "",
      amount: null,
      category: "Others",
      spentAt: todayStr,
      isExempt: false,
      walletId: null,
    };
  }

  let text = trimmed;
  let spentAt = todayStr;
  let isExempt = false;
  let matchedWalletId: string | null = null;
  let matchedWalletName: string | undefined;

  // 1a. Detect and Extract @wallet tokens (e.g. "@jajan", "@tabungan", "@harian")
  if (wallets && wallets.length > 0) {
    const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_\u00C0-\u024F-]+)/g;
    const mentions = [...text.matchAll(mentionRegex)];

    for (const match of mentions) {
      const rawTag = match[1];
      const tagLower = rawTag.toLowerCase().replace(/[-_]/g, " ").trim();
      const tagNoSpace = rawTag.toLowerCase().replace(/[-_\s]/g, "");

      // Match against available wallets:
      // Priority 1: Exact match on name (normalized or without spaces)
      let found = wallets.find((w) => {
        const wNorm = w.name.toLowerCase().trim();
        const wNoSpace = wNorm.replace(/[\s-_]/g, "");
        return wNorm === tagLower || wNoSpace === tagNoSpace;
      });

      // Priority 2: Substring / contains match
      if (!found) {
        found = wallets.find((w) => {
          const wNorm = w.name.toLowerCase().trim();
          const wNoSpace = wNorm.replace(/[\s-_]/g, "");
          return (
            wNorm.includes(tagLower) ||
            tagLower.includes(wNorm) ||
            wNoSpace.includes(tagNoSpace) ||
            tagNoSpace.includes(wNoSpace)
          );
        });
      }

      if (found) {
        matchedWalletId = found.id;
        matchedWalletName = found.name;
        text = text.replace(match[0], " ");
        break;
      }
    }
  }

  // 1b. Detect and Extract Hashtags / One-off Splurge markers
  const exemptRegex = /(?:^|\s)#(?:one-off|oneoff|splurge|exempt)\b/i;
  if (exemptRegex.test(text)) {
    isExempt = true;
    text = text.replace(exemptRegex, " ");
  }

  // 1c. Detect Quantity prefix multiplier (e.g. "2x kopi 15k" or "3 * bakso 20k")
  let quantityMultiplier: number | null = null;
  const qtyPrefixRegex = /(?:^|\s)(\d{1,2})\s*(?:x|\*)\s+/i;
  const qtyMatch = text.match(qtyPrefixRegex);
  if (qtyMatch) {
    const q = parseInt(qtyMatch[1], 10);
    if (!isNaN(q) && q > 0) {
      quantityMultiplier = q;
      text = text.replace(qtyPrefixRegex, " ");
    }
  }

  // 2. Detect Dates
  // 2a. Multi-word relative dates ("kemarin lusa", "day before yesterday", "lusa", "day after tomorrow")
  const dayBeforeYesterdayRegex = /\b(?:kemarin\s+lusa|day\s+before\s+yesterday)\b/i;
  if (dayBeforeYesterdayRegex.test(text)) {
    try {
      spentAt = format(subDays(parseISO(todayStr), 2), "yyyy-MM-dd");
    } catch {
      // fallback
    }
    text = text.replace(dayBeforeYesterdayRegex, " ");
  }

  const dayAfterTomorrowRegex = /\b(?:day\s+after\s+tomorrow|lusa)\b/i;
  if (dayAfterTomorrowRegex.test(text)) {
    try {
      spentAt = format(addDays(parseISO(todayStr), 2), "yyyy-MM-dd");
    } catch {
      // fallback
    }
    text = text.replace(dayAfterTomorrowRegex, " ");
  }

  // 2b. Relative days offsets ("2 hari lalu", "3 days ago")
  const relativeDaysAgoRegex = /\b(\d{1,2})\s*(?:hari\s+lalu|days?\s+ago)\b/i;
  const relMatch = text.match(relativeDaysAgoRegex);
  if (relMatch) {
    const days = parseInt(relMatch[1], 10);
    if (!isNaN(days) && days > 0 && days <= 365) {
      try {
        spentAt = format(subDays(parseISO(todayStr), days), "yyyy-MM-dd");
        text = text.replace(relativeDaysAgoRegex, " ");
      } catch {
        // fallback
      }
    }
  }

  // 2c. Colloquial night/yesterday ("semalam", "tadi malam")
  const lastNightRegex = /\b(?:semalam|tadi\s+malam)\b/i;
  if (lastNightRegex.test(text)) {
    try {
      spentAt = format(subDays(parseISO(todayStr), 1), "yyyy-MM-dd");
    } catch {
      // fallback
    }
    text = text.replace(lastNightRegex, " ");
  }

  // 2d. Explicit day of month ("tgl 15", "tanggal 20")
  const tglRegex = /\b(?:tgl|tanggal)\s*(\d{1,2})\b/i;
  const tglMatch = text.match(tglRegex);
  if (tglMatch) {
    const dayNum = parseInt(tglMatch[1], 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      try {
        const todayDate = parseISO(todayStr);
        let target = setDate(todayDate, dayNum);
        // If dayNum is in the future compared to today, it likely means previous month
        if (dayNum > getDate(todayDate)) {
          target = setMonth(target, getMonth(todayDate) - 1);
        }
        spentAt = format(target, "yyyy-MM-dd");
        text = text.replace(tglRegex, " ");
      } catch {
        // fallback
      }
    }
  }

  // 2e. Day of the Week (e.g. "Wednesday", "Rabu", "hari rabu", "on wednesday", "rabu kemarin", "last wednesday")
  const dayMatch = text.match(prefixDayRegex);
  let dayKey = "";
  let modifier = "";
  let matchedFull = "";

  if (dayMatch) {
    modifier = dayMatch[1];
    dayKey = dayMatch[2];
    matchedFull = dayMatch[0];
  } else {
    const sMatch = text.match(suffixDayRegex);
    if (sMatch) {
      const matchPos = text.search(suffixDayRegex);
      const preceding = text.slice(0, matchPos);
      const isPerWeek = /(?:per|tiap|setiap|every)\s+$/i.test(preceding);
      if (!isPerWeek) {
        dayKey = sMatch[1];
        modifier = sMatch[2] || "";
        matchedFull = sMatch[0];
      }
    }
  }

  if (dayKey) {
    const dayIndex = DAY_NAME_TO_INDEX[dayKey.toLowerCase()];
    if (dayIndex) {
      try {
        const todayDate = parseISO(todayStr);
        const weekStart = startOfWeek(todayDate, { weekStartsOn: 1 });
        let targetDate = addDays(weekStart, dayIndex - 1);

        const cleanMod = modifier.toLowerCase().trim();
        if (
          cleanMod === "lalu" ||
          cleanMod === "last" ||
          cleanMod === "minggu lalu" ||
          cleanMod === "last week"
        ) {
          targetDate = subWeeks(targetDate, 1);
        } else if (
          cleanMod === "depan" ||
          cleanMod === "next" ||
          cleanMod === "minggu depan" ||
          cleanMod === "next week"
        ) {
          targetDate = addWeeks(targetDate, 1);
        } else if (cleanMod === "kemarin") {
          if (targetDate >= todayDate) {
            targetDate = subWeeks(targetDate, 1);
          }
        } else {
          // If no modifier, or "ini" / "this" / "minggu ini" / "this week":
          // If the day has not passed yet this week (i.e. is in the future),
          // it refers to the day from the previous week.
          if (targetDate > todayDate) {
            targetDate = subWeeks(targetDate, 1);
          }
        }

        spentAt = format(targetDate, "yyyy-MM-dd");
        text = text.replace(matchedFull, " ");
      } catch {
        // fallback
      }
    }
  }

  // 2f. Standalone Relative Dates ("kemarin", "yesterday", "besok", "tomorrow", "hari ini", "today", "tadi pagi", "tadi siang", "tadi")
  const yesterdayRegex = /\b(?:kemarin|yesterday)\b/i;
  if (yesterdayRegex.test(text)) {
    try {
      const yesterdayDate = subDays(parseISO(todayStr), 1);
      spentAt = format(yesterdayDate, "yyyy-MM-dd");
    } catch {
      // fallback
    }
    text = text.replace(yesterdayRegex, " ");
  }

  const tomorrowRegex = /\b(?:besok|tomorrow)\b/i;
  if (tomorrowRegex.test(text)) {
    try {
      const tomorrowDate = addDays(parseISO(todayStr), 1);
      spentAt = format(tomorrowDate, "yyyy-MM-dd");
    } catch {
      // fallback
    }
    text = text.replace(tomorrowRegex, " ");
  }

  const todayRegex = /\b(?:hari\s+ini|today|tadi\s+(?:pagi|siang|sore)|tadi)\b/i;
  if (todayRegex.test(text)) {
    spentAt = todayStr;
    text = text.replace(todayRegex, " ");
  }

  // 3. Extract Amount & Handle Multipliers
  let amount: number | null = null;
  let matchedAmountText: string | undefined;

  const isIdr = currency === "IDR";

  // Helper to parse unit string (e.g. "15k" -> 15000, "20.000" -> 20000)
  const parseUnitAmount = (raw: string): number | null => {
    const clean = raw.trim().toLowerCase();
    // Millions
    const mPattern = isIdr
      ? /^(\d+(?:[.,]\d+)?)\s*(?:jt|juta|mio|m)$/
      : /^(\d+(?:[.,]\d+)?)\s*(?:m|mio)$/;
    const mMatch = clean.match(mPattern);
    if (mMatch) {
      const v = parseFloat(mMatch[1].replace(",", "."));
      return isNaN(v) ? null : Math.round(v * 1000000);
    }
    // Thousands suffix
    const kPattern = isIdr
      ? /^(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)$/
      : /^(\d+(?:[.,]\d+)?)\s*k$/;
    const kMatch = clean.match(kPattern);
    if (kMatch) {
      const v = parseFloat(kMatch[1].replace(",", "."));
      return isNaN(v) ? null : Math.round(v * 1000);
    }
    // Formatted thousands dot/comma or currency
    const numClean = clean.replace(/^(?:rp|idr|rm|usd|eur|sgd|aud|[$€])\.?\s*/i, "");
    if (!isIdr && /\d+\.\d{1,2}$/.test(numClean)) {
      const val = parseFloat(numClean);
      return isNaN(val) ? null : val;
    }
    const val = parseInt(numClean.replace(/[.,]/g, ""), 10);
    return isNaN(val) ? null : val;
  };

  // Pattern A0: Explicit Multipliers (e.g. "2x 15k", "kopi 18k x 2", "2 * 20.000", "3 porsi 25k")
  const qtyMultiplierPattern = isIdr
    ? /\b(\d+)\s*(?:x|\*|porsi|pcs|cup|gelas|bungkus|paket)\s+(\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta|mio|m)?|\d{1,3}(?:[.,]\d{3})+)\b/i
    : /\b(\d+)\s*(?:x|\*|pcs|cup|pack)\s+(\d+(?:[.,]\d+)?\s*(?:k|m|mio)?|\d{1,3}(?:[.,]\d{3})+)\b/i;
  const prefixMulMatch = text.match(qtyMultiplierPattern);
  if (prefixMulMatch) {
    const qty = parseInt(prefixMulMatch[1], 10);
    const unitPrice = parseUnitAmount(prefixMulMatch[2]);
    if (!isNaN(qty) && qty > 0 && unitPrice !== null && unitPrice > 0) {
      amount = qty * unitPrice;
      matchedAmountText = prefixMulMatch[0];
      text = text.replace(qtyMultiplierPattern, " ");
    }
  }

  if (amount === null) {
    const suffixMultiplierRegex = isIdr
      ? /\b(\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta|mio|m)?|\d{1,3}(?:[.,]\d{3})+)\s*(?:x|\*)\s*(\d+)\b/i
      : /\b(\d+(?:[.,]\d+)?\s*(?:k|m|mio)?|\d{1,3}(?:[.,]\d{3})+)\s*(?:x|\*)\s*(\d+)\b/i;
    const suffixMulMatch = text.match(suffixMultiplierRegex);
    if (suffixMulMatch) {
      const unitPrice = parseUnitAmount(suffixMulMatch[1]);
      const qty = parseInt(suffixMulMatch[2], 10);
      if (!isNaN(qty) && qty > 0 && unitPrice !== null && unitPrice > 0) {
        amount = qty * unitPrice;
        matchedAmountText = suffixMulMatch[0];
        text = text.replace(suffixMultiplierRegex, " ");
      }
    }
  }

  // Pattern A: Suffix multiplier (e.g. 25k, 25.5k, 20rb, 50ribu, 100k)
  if (amount === null) {
    const suffixRegex = isIdr
      ? /\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu)\b/i
      : /\b(\d+(?:[.,]\d+)?)\s*(k)\b/i;
    const suffixMatch = text.match(suffixRegex);

    if (suffixMatch) {
      const rawVal = parseFloat(suffixMatch[1].replace(",", "."));
      if (!isNaN(rawVal)) {
        amount = Math.round(rawVal * 1000);
        matchedAmountText = suffixMatch[0];
        text = text.replace(suffixRegex, " ");
      }
    }
  }

  // Pattern B: Millions suffix multiplier (e.g. 1.5jt, 2juta, 1m)
  if (amount === null) {
    const millionsRegex = isIdr
      ? /\b(\d+(?:[.,]\d+)?)\s*(jt|juta|mio)\b/i
      : /\b(\d+(?:[.,]\d+)?)\s*(m|mio)\b/i;
    const millionsMatch = text.match(millionsRegex);
    if (millionsMatch) {
      const rawVal = parseFloat(millionsMatch[1].replace(",", "."));
      if (!isNaN(rawVal)) {
        amount = Math.round(rawVal * 1000000);
        matchedAmountText = millionsMatch[0];
        text = text.replace(millionsRegex, " ");
      }
    }
  }

  // Pattern C: Currency prefix (e.g. Rp 25.000, $12.50, €15, RM 25)
  if (amount === null) {
    const currPrefixRegex = /(?:[$€]|s\$|a\$|\b(?:rp|idr|rm|usd|eur|sgd|aud)\b\.?)\s*(\d{1,3}(?:[.,]\d{3})+|\d+(?:\.\d{1,2})?|\d+)/i;
    const currMatch = text.match(currPrefixRegex);
    if (currMatch) {
      const matchedNumStr = currMatch[1];
      let val: number;
      if (!isIdr && /^\d+\.\d{1,2}$/.test(matchedNumStr)) {
        val = parseFloat(matchedNumStr);
      } else {
        const cleanNum = matchedNumStr.replace(/[.,]/g, "");
        val = parseInt(cleanNum, 10);
      }
      if (!isNaN(val)) {
        amount = val;
        matchedAmountText = currMatch[0];
        text = text.replace(currPrefixRegex, " ");
      }
    }
  }

  // Pattern D: Decimal numbers for non-IDR currencies (e.g. "coffee 4.50" or "lunch 12.99")
  if (amount === null && !isIdr) {
    const decimalRegex = /\b(\d+\.\d{1,2})\b/;
    const decimalMatch = text.match(decimalRegex);
    if (decimalMatch) {
      const val = parseFloat(decimalMatch[1]);
      if (!isNaN(val)) {
        amount = val;
        matchedAmountText = decimalMatch[0];
        text = text.replace(decimalRegex, " ");
      }
    }
  }

  // Pattern E: Formatted number with dots or commas (e.g. 25.000, 150.000, 25,000)
  if (amount === null) {
    const formattedRegex = /\b(\d{1,3}(?:[.,]\d{3})+)\b/;
    const formattedMatch = text.match(formattedRegex);
    if (formattedMatch) {
      const cleanNum = formattedMatch[1].replace(/[.,]/g, "");
      const val = parseInt(cleanNum, 10);
      if (!isNaN(val)) {
        amount = val;
        matchedAmountText = formattedMatch[0];
        text = text.replace(formattedRegex, " ");
      }
    }
  }

  // Pattern F: Disambiguated plain numbers (e.g. "2 roti 15000" or "indomie 25000" or "lunch 15")
  if (amount === null) {
    const plainMatches = [...text.matchAll(/\b(\d+)\b/g)];
    if (plainMatches.length > 0) {
      // For IDR prioritize numbers >= 100, for other currencies any positive integer
      const minThreshold = isIdr ? 100 : 1;
      let chosenMatch = plainMatches.find((m) => parseInt(m[1], 10) >= minThreshold);
      if (!chosenMatch) {
        // Fallback to the rightmost number
        chosenMatch = plainMatches[plainMatches.length - 1];
      }

      if (chosenMatch) {
        const val = parseInt(chosenMatch[1], 10);
        if (!isNaN(val)) {
          amount = val;
          matchedAmountText = chosenMatch[0];
          // Replace only this chosen occurrence
          const idx = chosenMatch.index ?? 0;
          text = text.slice(0, idx) + " " + text.slice(idx + chosenMatch[0].length);
        }
      }
    }
  }

  // Apply quantity prefix multiplier if detected
  if (quantityMultiplier !== null && amount !== null) {
    amount = amount * quantityMultiplier;
  }

  // Clean up remaining text to form the name
  let name = text
    .replace(/(?:[$€]|s\$|a\$|\b(?:rp|idr|rm|usd|eur|sgd|aud)\b)/gi, "")
    .replace(/[#@][\w-]+/g, "") // Clean remaining hashtags/mentions
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first alphabetic character of name for clean presentation
  if (name.length > 0) {
    name = name.replace(/[a-zA-Z]/, (c) => c.toUpperCase());
  }

  // 4. Detect Category
  let category: CategoryKey = "Others";
  const lowerName = name.toLowerCase();

  // 4a. Check custom chips first (exact/substring name match)
  for (const chip of customChips) {
    const chipLower = chip.name.toLowerCase();
    if (
      lowerName.includes(chipLower) ||
      chipLower.includes(lowerName) ||
      new RegExp(`\\b${chipLower}\\b`, "i").test(lowerName)
    ) {
      category = chip.category;
      break;
    }
  }

  // 4b. Check high-specificity multi-word phrases first
  if (category === "Others") {
    for (const item of MULTI_WORD_CATEGORY_KEYWORDS) {
      if (item.pattern.test(lowerName)) {
        category = item.category;
        break;
      }
    }
  }

  // 4c. Check word-boundary regexes
  if (category === "Others") {
    for (const [cat, regex] of Object.entries(CATEGORY_REGEXES) as [Exclude<CategoryKey, "Others">, RegExp][]) {
      if (regex.test(lowerName)) {
        category = cat;
        break;
      }
    }
  }

  const isValid = Boolean(name.length > 0 && amount !== null && amount > 0);

  return {
    isValid,
    name,
    amount,
    category,
    spentAt,
    isExempt,
    matchedAmountText,
    walletId: matchedWalletId,
    matchedWalletName,
  };
}

