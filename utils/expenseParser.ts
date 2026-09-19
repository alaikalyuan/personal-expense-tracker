import { CategoryKey } from "./i18n/dictionaries";
import { QuickChip } from "./quickChips";
import { addDays, subDays, addWeeks, subWeeks, startOfWeek, format, parseISO } from "date-fns";

export interface ParsedExpense {
  isValid: boolean;
  name: string;
  amount: number | null;
  category: CategoryKey;
  spentAt: string;
  matchedAmountText?: string;
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

const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  "Food & Dining": [
    "makan", "minum", "kopi", "coffee", "snack", "sarapan", "lunch", "dinner",
    "ayam", "nasi", "mie", "bakso", "cafe", "food", "warung", "resto",
    "burger", "pizza", "tea", "teh", "roti", "jus", "boba", "jajan",
    "martabak", "sate", "pecel", "soto", "padang", "goceng", "cemilan",
    "siang", "malam", "pagi", "dinner", "breakfast", "meal", "drink",
    "kantin", "canteen", "restaurant", "snacks", "beverage", "kafe", "warteg"

  ],
  Transportation: [
    "bensin", "pertalite", "pertamax", "gojek", "gocar", "goride", "grab",
    "grabcar", "grabbike", "maxim", "ojol", "angkot", "parkir", "tol",
    "kereta", "mrt", "bus", "transjakarta", "taksi", "taxi", "transport",
    "krl", "commuter", "fuel", "gas", "parking", "train"
  ],
  Utilities: [
    "listrik", "air", "pdam", "wifi", "kuota", "pulsa", "internet",
    "laundry", "kos", "kontrakan", "sabun", "shampoo", "galon", "gas",
    "token", "pln", "bpjs", "bill", "electricity", "water", "phone"
  ],
  Academics: [
    "buku", "print", "fotokopi", "kursus", "kuliah", "spp", "alat tulis",
    "atk", "seminar", "skripsi", "tugas", "modul", "kampus", "ukm",
    "book", "study", "tuition", "photocopy", "stationery"
  ],
  Entertainment: [
    "nonton", "bioskop", "cinema", "game", "steam", "spotify", "netflix",
    "jalan", "liburan", "karaoke", "billiard", "top up", "diamond",
    "mlbb", "pubg", "valorant", "genshin", "movie", "concert", "holiday"
  ],
  Others: [],
};

export function parseQuickExpenseInput(
  input: string,
  todayStr: string,
  customChips: QuickChip[] = []
): ParsedExpense {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      name: "",
      amount: null,
      category: "Others",
      spentAt: todayStr,
    };
  }

  let text = trimmed;
  let spentAt = todayStr;

  // 1. Detect Multi-Word Relative Dates ("kemarin lusa", "day before yesterday", "lusa", "day after tomorrow")
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

  // 2. Detect Day of the Week (e.g. "Wednesday", "Rabu", "hari rabu", "on wednesday", "rabu kemarin", "last wednesday")
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

  // 3. Detect Standalone Relative Dates ("kemarin", "yesterday", "besok", "tomorrow", "hari ini", "today")
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

  const todayRegex = /\b(?:hari\s+ini|today)\b/i;
  if (todayRegex.test(text)) {
    spentAt = todayStr;
    text = text.replace(todayRegex, " ");
  }

  // 2. Extract Amount
  let amount: number | null = null;
  let matchedAmountText: string | undefined;

  // Pattern A: Suffix multiplier (e.g. 25k, 25.5k, 20rb, 50ribu, 100k)
  const suffixRegex = /\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu)\b/i;
  const suffixMatch = text.match(suffixRegex);

  if (suffixMatch) {
    const rawVal = parseFloat(suffixMatch[1].replace(",", "."));
    if (!isNaN(rawVal)) {
      amount = Math.round(rawVal * 1000);
      matchedAmountText = suffixMatch[0];
      text = text.replace(suffixRegex, " ");
    }
  }

  // Pattern B: Millions suffix multiplier (e.g. 1.5jt, 2juta, 1m)
  if (amount === null) {
    const millionsRegex = /\b(\d+(?:[.,]\d+)?)\s*(jt|juta|mio)\b/i;
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

  // Pattern C: Currency prefix (e.g. Rp 25.000, Rp25000, IDR 50.000)
  if (amount === null) {
    const rpRegex = /\b(?:rp|idr)\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)\b/i;
    const rpMatch = text.match(rpRegex);
    if (rpMatch) {
      const cleanNum = rpMatch[1].replace(/\./g, "");
      const val = parseInt(cleanNum, 10);
      if (!isNaN(val)) {
        amount = val;
        matchedAmountText = rpMatch[0];
        text = text.replace(rpRegex, " ");
      }
    }
  }

  // Pattern D: Formatted number with dots (e.g. 25.000, 150.000)
  if (amount === null) {
    const dottedRegex = /\b(\d{1,3}(?:\.\d{3})+)\b/;
    const dottedMatch = text.match(dottedRegex);
    if (dottedMatch) {
      const cleanNum = dottedMatch[1].replace(/\./g, "");
      const val = parseInt(cleanNum, 10);
      if (!isNaN(val)) {
        amount = val;
        matchedAmountText = dottedMatch[0];
        text = text.replace(dottedRegex, " ");
      }
    }
  }

  // Pattern E: Standalone plain numbers (e.g. 25000, 5000)
  if (amount === null) {
    const plainNumRegex = /\b(\d+)\b/;
    const plainMatch = text.match(plainNumRegex);
    if (plainMatch) {
      const val = parseInt(plainMatch[1], 10);
      if (!isNaN(val)) {
        amount = val;
        matchedAmountText = plainMatch[0];
        text = text.replace(plainNumRegex, " ");
      }
    }
  }

  // Clean up remaining text to form the name
  let name = text
    .replace(/\b(?:rp|idr)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first letter of name for clean presentation
  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // 3. Detect Category
  let category: CategoryKey = "Others";
  const lowerName = name.toLowerCase();

  // 3a. Check custom chips first
  for (const chip of customChips) {
    if (lowerName.includes(chip.name.toLowerCase()) || chip.name.toLowerCase().includes(lowerName)) {
      category = chip.category;
      break;
    }
  }

  // 3b. If still Others, check keyword dictionaries
  if (category === "Others") {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CategoryKey, string[]][]) {
      if (cat === "Others") continue;
      const found = keywords.some((kw) => lowerName.includes(kw));
      if (found) {
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
    matchedAmountText,
  };
}

