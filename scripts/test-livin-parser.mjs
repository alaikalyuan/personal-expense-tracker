import assert from "node:assert";
import {
  parseLivinEmail,
  parseDateString,
  parseAmountString,
  stripHtmlToText,
  inferCategoryFromMerchant,
} from "../utils/email/livinParser.ts";

console.log("--- Starting Livin Parser Tests ---");

// Test 1: Exact text replica from user's uploaded screenshot
const userScreenshotText = `
Livin' <noreply.livin@bankmandiri.co.id>
Pembayaran Berhasil

Halo ALAIKAL HAMDIA HAMDANI,

Berikut adalah detail transaksi Anda dengan QR:

Penerima
TEH CAMELLIA
Surabaya (Kota) - ID

Tanggal
12 Okt 2026

Jam
12:02:55 WIB

Nominal Transaksi
Rp 5.000,00
`;

const res1 = parseLivinEmail(userScreenshotText);
console.log("Test 1 Result:", res1);

assert.strictEqual(res1.isValid, true, "Test 1 must be valid");
assert.strictEqual(res1.merchantName, "TEH CAMELLIA", "Merchant name must be TEH CAMELLIA");
assert.strictEqual(res1.amount, 5000, "Amount must be 5000");
assert.strictEqual(res1.date, "2026-10-12", "Date must be 2026-10-12");
assert.strictEqual(res1.time, "12:02:55", "Time must be 12:02:55");
assert.strictEqual(res1.suggestedCategory, "Food & Dining", "Category must be Food & Dining");
assert.ok(res1.referenceId.includes("LIVIN-20261012-120255-5000-tehcamellia"), "Reference ID must be deterministic");

// Test 2: HTML Email variation with table and explicit Reference No
const htmlEmailSample = `
<!DOCTYPE html>
<html>
<body>
  <div>Livin' by Mandiri</div>
  <h2>Pembayaran Berhasil</h2>
  <p>Berikut adalah detail transaksi Anda dengan QR:</p>
  <table>
    <tr><td>Penerima</td><td>KOPI KENANGAN GRAND INDONESIA</td></tr>
    <tr><td>Tanggal</td><td>05 Mei 2026</td></tr>
    <tr><td>Jam</td><td>09:15:00 WIB</td></tr>
    <tr><td>Nominal Transaksi</td><td>Rp 38.000,00</td></tr>
    <tr><td>No. Referensi</td><td>REF-20260505-998811</td></tr>
  </table>
</body>
</html>
`;

const res2 = parseLivinEmail(htmlEmailSample);
console.log("Test 2 Result:", res2);

assert.strictEqual(res2.isValid, true);
assert.strictEqual(res2.merchantName, "KOPI KENANGAN GRAND INDONESIA");
assert.strictEqual(res2.amount, 38000);
assert.strictEqual(res2.date, "2026-05-05");
assert.strictEqual(res2.time, "09:15:00");
assert.strictEqual(res2.referenceId, "REF-20260505-998811");
assert.strictEqual(res2.suggestedCategory, "Food & Dining");

// Test 3: Gas station / Pertamina SPBU (Transportation category test)
const transportSample = `
Penerima: SPBU PERTAMINA 34.1234
Tanggal: 10 Nov 2026
Jam: 17:45 WIB
Nominal Transaksi: Rp 100.000,00
`;

const res3 = parseLivinEmail(transportSample);
console.log("Test 3 Result:", res3);

assert.strictEqual(res3.isValid, true);
assert.strictEqual(res3.merchantName, "SPBU PERTAMINA 34.1234");
assert.strictEqual(res3.amount, 100000);
assert.strictEqual(res3.date, "2026-11-10");
assert.strictEqual(res3.suggestedCategory, "Transportation");

// Test 4: Helper function tests
assert.strictEqual(parseAmountString("Rp 1.250.000,00"), 1250000);
assert.strictEqual(parseAmountString("Rp 15.000"), 15000);
assert.strictEqual(parseAmountString("5000,00"), 5000);
assert.strictEqual(parseDateString("12 Okt 2026"), "2026-10-12");
assert.strictEqual(parseDateString("1 Januari 2026"), "2026-01-01");
assert.strictEqual(parseDateString("25/12/2026"), "2026-12-25");

console.log("✅ All Livin parser tests passed successfully!");
