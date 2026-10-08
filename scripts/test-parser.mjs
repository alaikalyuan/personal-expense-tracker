import assert from "node:assert/strict";
import { parseQuickExpenseInput } from "../utils/expenseParser.ts";

const TODAY = "2026-09-19";

console.log("Running expenseParser test suite...\n");

const tests = [
  // 1. Basic amount with suffix
  {
    input: "Kopi 18k",
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: TODAY, isExempt: false },
  },
  // 2. Quantity disambiguation: 2 indomie 15000 (should NOT parse 2 as amount!)
  {
    input: "2 indomie 15000",
    expected: { name: "2 Indomie", amount: 15000, category: "Food & Dining", spentAt: TODAY },
  },
  // 3. Multiplier math: 2x 15k
  {
    input: "2x kopi 15k",
    expected: { name: "Kopi", amount: 30000, category: "Food & Dining", spentAt: TODAY },
  },
  // 4. Multiplier math reverse: kopi 18k x 2
  {
    input: "kopi 18k x 2",
    expected: { name: "Kopi", amount: 36000, category: "Food & Dining", spentAt: TODAY },
  },
  // 5. Word boundary false positive: "botol minum 15k" should NOT match "tol" -> Transportation
  {
    input: "botol minum 15k",
    expected: { name: "Botol minum", amount: 15000, category: "Food & Dining" },
  },
  // 6. Word boundary false positive: "telur rebus 5k" should NOT match "bus" -> Transportation
  {
    input: "telur rebus 5k",
    expected: { name: "Telur rebus", amount: 5000, category: "Food & Dining" },
  },
  // 7. Word boundary false positive: "bagasi 50k" should match Transportation (not "gas" -> Utilities)
  {
    input: "bagasi 50k",
    expected: { name: "Bagasi", amount: 50000, category: "Transportation" },
  },
  // 8. Time indicator disambiguation: "ojol tadi pagi 15k" should be Transportation, spentAt today
  {
    input: "ojol tadi pagi 15k",
    expected: { name: "Ojol", amount: 15000, category: "Transportation", spentAt: TODAY },
  },
  // 9. Colloquial night/yesterday: "bakso 25k semalam"
  {
    input: "bakso 25k semalam",
    expected: { name: "Bakso", amount: 25000, category: "Food & Dining", spentAt: "2026-09-18" },
  },
  // 10. Colloquial night: "nasi goreng 20k tadi malam"
  {
    input: "nasi goreng 20k tadi malam",
    expected: { name: "Nasi goreng", amount: 20000, category: "Food & Dining", spentAt: "2026-09-18" },
  },
  // 11. Relative days: "bensin 30k 2 hari lalu"
  {
    input: "bensin 30k 2 hari lalu",
    expected: { name: "Bensin", amount: 30000, category: "Transportation", spentAt: "2026-09-17" },
  },
  // 12. Comma thousands formatting: "makan 35,000"
  {
    input: "makan 35,000",
    expected: { name: "Makan", amount: 35000, category: "Food & Dining", spentAt: TODAY },
  },
  // 13. Currency prefix: "Rp 50.000 listrik"
  {
    input: "Rp 50.000 listrik",
    expected: { name: "Listrik", amount: 50000, category: "Utilities", spentAt: TODAY },
  },
  // 14. Hashtag exemption: "sepatu 500k #one-off"
  {
    input: "sepatu 500k #one-off",
    expected: { name: "Sepatu", amount: 500000, category: "Others", isExempt: true },
  },
  // 15. Millions suffix: "1.5jt servis laptop"
  {
    input: "1.5jt servis laptop",
    expected: { name: "Servis laptop", amount: 1500000, category: "Others" },
  },
  // 16. Academic multiword: "alat tulis 25k"
  {
    input: "alat tulis 25k",
    expected: { name: "Alat tulis", amount: 25000, category: "Academics" },
  },
  // 17. Entertainment: "bioskop 50k"
  {
    input: "bioskop 50k",
    expected: { name: "Bioskop", amount: 50000, category: "Entertainment" },
  },
  // 18. Day of week on Monday: writing on Monday and typing saturday should NOT place date in the future
  {
    input: "kopi 18k saturday",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-09-26" },
  },
  {
    input: "kopi 18k sabtu",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-09-26" },
  },
  {
    input: "bensin 30k hari sabtu",
    today: "2026-09-28", // Monday
    expected: { name: "Bensin", amount: 30000, category: "Transportation", spentAt: "2026-09-26" },
  },
  {
    input: "kopi 18k monday",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-09-28" },
  },
  {
    input: "makan 25k senin",
    today: "2026-09-28", // Monday
    expected: { name: "Makan", amount: 25000, category: "Food & Dining", spentAt: "2026-09-28" },
  },
  {
    input: "makan 25k minggu",
    today: "2026-09-28", // Monday
    expected: { name: "Makan", amount: 25000, category: "Food & Dining", spentAt: "2026-09-27" },
  },
  {
    input: "kopi 18k jumat",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-09-25" },
  },
  {
    input: "makan 30k sabtu kemarin",
    today: "2026-09-28", // Monday
    expected: { name: "Makan", amount: 30000, category: "Food & Dining", spentAt: "2026-09-26" },
  },
  // 19. Day of week on Friday: past day in current week vs future day
  {
    input: "makan 20k senin",
    today: "2026-10-02", // Friday
    expected: { name: "Makan", amount: 20000, category: "Food & Dining", spentAt: "2026-09-28" },
  },
  {
    input: "kopi 15k sabtu",
    today: "2026-10-02", // Friday
    expected: { name: "Kopi", amount: 15000, category: "Food & Dining", spentAt: "2026-09-26" },
  },
  // 20. Day of week on Sunday: saturday should be yesterday
  {
    input: "nasi 25k sabtu",
    today: "2026-10-04", // Sunday
    expected: { name: "Nasi", amount: 25000, category: "Food & Dining", spentAt: "2026-10-03" },
  },
  // 21. Explicit modifiers (next week / last week / yesterday)
  {
    input: "kopi 18k sabtu lalu",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-09-26" },
  },
  {
    input: "kopi 18k senin lalu",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-09-21" },
  },
  {
    input: "kopi 18k sabtu depan",
    today: "2026-09-28", // Monday
    expected: { name: "Kopi", amount: 18000, category: "Food & Dining", spentAt: "2026-10-10" },
  },
  {
    input: "lunch 30k on wednesday",
    today: "2026-09-28", // Monday
    expected: { name: "Lunch", amount: 30000, category: "Food & Dining", spentAt: "2026-09-23" },
  },
  // 22. Multi-currency: USD decimal
  {
    input: "coffee 4.50",
    currency: "USD",
    expected: { name: "Coffee", amount: 4.5, category: "Food & Dining", spentAt: TODAY },
  },
  // 23. Multi-currency: USD with dollar sign
  {
    input: "$12 lunch",
    currency: "USD",
    expected: { name: "Lunch", amount: 12, category: "Food & Dining", spentAt: TODAY },
  },
  // 24. Multi-currency: EUR with euro sign and decimal
  {
    input: "€8.50 pizza",
    currency: "EUR",
    expected: { name: "Pizza", amount: 8.5, category: "Food & Dining", spentAt: TODAY },
  },
  // 25. Multi-currency: MYR
  {
    input: "RM 15 nasi lemak",
    currency: "MYR",
    expected: { name: "Nasi lemak", amount: 15, category: "Food & Dining", spentAt: TODAY },
  },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  try {
    const res = parseQuickExpenseInput(t.input, t.today || TODAY, [], t.currency || "IDR");
    if (t.expected.name !== undefined) {
      assert.equal(res.name, t.expected.name, `Name mismatch for "${t.input}": got "${res.name}", expected "${t.expected.name}"`);
    }
    if (t.expected.amount !== undefined) {
      assert.equal(res.amount, t.expected.amount, `Amount mismatch for "${t.input}": got ${res.amount}, expected ${t.expected.amount}`);
    }
    if (t.expected.category !== undefined) {
      assert.equal(res.category, t.expected.category, `Category mismatch for "${t.input}": got "${res.category}", expected "${t.expected.category}"`);
    }
    if (t.expected.spentAt !== undefined) {
      assert.equal(res.spentAt, t.expected.spentAt, `SpentAt mismatch for "${t.input}": got "${res.spentAt}", expected "${t.expected.spentAt}"`);
    }
    if (t.expected.isExempt !== undefined) {
      assert.equal(res.isExempt, t.expected.isExempt, `isExempt mismatch for "${t.input}": got ${res.isExempt}, expected ${t.expected.isExempt}`);
    }
    console.log(`✓ PASS: "${t.input}" -> [${res.name}, Rp ${res.amount}, ${res.category}, ${res.spentAt}, exempt: ${res.isExempt}]`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: "${t.input}": ${err.message}`);
    failed++;
  }
}

console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
