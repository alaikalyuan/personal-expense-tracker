import { CategoryKey } from "./i18n/dictionaries";

export interface QuickChip {
  id: string;
  name: string;
  category: CategoryKey;
  emoji?: string;
  defaultAmount?: number;
}

export const DEFAULT_QUICK_CHIPS: QuickChip[] = [
  {
    id: "chip-lunch",
    name: "Makan Siang",
    category: "Food & Dining",
    emoji: "🍔",
    defaultAmount: 25000,
  },
  {
    id: "chip-coffee",
    name: "Kopi / Jajan",
    category: "Food & Dining",
    emoji: "☕",
    defaultAmount: 18000,
  },
  {
    id: "chip-fuel",
    name: "Bensin",
    category: "Transportation",
    emoji: "⛽",
    defaultAmount: 20000,
  },
  {
    id: "chip-parking",
    name: "Parkir",
    category: "Transportation",
    emoji: "🅿️",
    defaultAmount: 2000,
  },
  {
    id: "chip-laundry",
    name: "Laundry",
    category: "Utilities",
    emoji: "🧺",
  },
  {
    id: "chip-print",
    name: "Print / ATK",
    category: "Academics",
    emoji: "🖨️",
  },
];

const CHIPS_STORAGE_KEY = "sakutrack_quick_chips_v1";
const INPUT_MODE_STORAGE_KEY = "sakutrack_input_mode_v1";
const KEEP_BATCH_STORAGE_KEY = "sakutrack_keep_batch_v1";

export function getStoredQuickChips(): QuickChip[] {
  if (typeof window === "undefined") return DEFAULT_QUICK_CHIPS;
  try {
    const raw = localStorage.getItem(CHIPS_STORAGE_KEY);
    if (!raw) return DEFAULT_QUICK_CHIPS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore parse error, fallback
  }
  return DEFAULT_QUICK_CHIPS;
}

export function saveQuickChips(chips: QuickChip[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHIPS_STORAGE_KEY, JSON.stringify(chips));
  } catch {
    // ignore write errors
  }
}

export function resetQuickChips(): QuickChip[] {
  if (typeof window === "undefined") return DEFAULT_QUICK_CHIPS;
  try {
    localStorage.removeItem(CHIPS_STORAGE_KEY);
  } catch {
    // ignore write errors
  }
  return DEFAULT_QUICK_CHIPS;
}

export function getStoredInputMode(): "standard" | "quick_type" {
  if (typeof window === "undefined") return "standard";
  try {
    const mode = localStorage.getItem(INPUT_MODE_STORAGE_KEY);
    if (mode === "quick_type" || mode === "standard") return mode;
  } catch {
    // ignore
  }
  return "standard";
}

export function saveInputMode(mode: "standard" | "quick_type"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INPUT_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function getStoredKeepBatch(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(KEEP_BATCH_STORAGE_KEY);
    if (val !== null) return val === "true";
  } catch {
    // ignore
  }
  return true;
}

export function saveKeepBatch(keep: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEEP_BATCH_STORAGE_KEY, String(keep));
  } catch {
    // ignore
  }
}

