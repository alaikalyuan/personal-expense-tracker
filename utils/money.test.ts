import { describe, expect, it } from "vitest";
import {
  MONEY_ERRORS,
  formatRupiahInput,
  parseMoneyInput,
  caretAfterDigits,
  parseMoneyTyping,
  parseRupiahAmount,
  parseRupiahInput,
  parseRupiahTyping,
} from "./money";

describe("parseRupiahInput", () => {
  it.each([
    ["2000000", 2000000],
    ["2.000.000", 2000000],
    ["Rp 2.000.000", 2000000],
    ["Rp2.000.000", 2000000],
    ["rp. 15.000", 15000],
    ["  86.900  ", 86900],
    ["999", 999],
    ["1.000", 1000],
    ["007", 7],
  ])("parses %j as %d", (raw, expected) => {
    expect(parseRupiahInput(raw)).toEqual({ ok: true, value: expected });
  });

  it.each([
    ["15.000,50", MONEY_ERRORS.decimalComma],
    ["15000,00", MONEY_ERRORS.decimalComma],
    ["2,000,000", MONEY_ERRORS.commaGrouping],
    ["-5", MONEY_ERRORS.negative],
    ["Rp -5.000", MONEY_ERRORS.negative],
    ["1e5", MONEY_ERRORS.notNumber],
    ["abc", MONEY_ERRORS.notNumber],
    ["12a", MONEY_ERRORS.notNumber],
    ["+5", MONEY_ERRORS.notNumber],
    ["2 000", MONEY_ERRORS.notNumber],
    ["2.00", MONEY_ERRORS.grouping],
    ["2.000000", MONEY_ERRORS.grouping],
    ["20.00.000", MONEY_ERRORS.grouping],
    ["2.", MONEY_ERRORS.grouping],
    [".500", MONEY_ERRORS.grouping],
    ["", MONEY_ERRORS.empty],
    ["   ", MONEY_ERRORS.empty],
    ["0", MONEY_ERRORS.zero],
    ["1.000.000.000.000", MONEY_ERRORS.tooLarge],
  ])("rejects %j", (raw, error) => {
    expect(parseRupiahInput(raw)).toEqual({ ok: false, error });
  });

  it("accepts zero and empty only when allowed", () => {
    expect(parseRupiahInput("0", { allowZero: true })).toEqual({ ok: true, value: 0 });
    expect(parseRupiahInput("", { allowEmpty: true })).toEqual({ ok: true, value: 0 });
    expect(parseRupiahInput("0", { allowEmpty: true }).ok).toBe(false);
  });

  it("enforces an upper bound with a default or custom message", () => {
    expect(parseRupiahInput("220.000", { max: 220000 })).toEqual({ ok: true, value: 220000 });
    expect(parseRupiahInput("220.001", { max: 220000 })).toEqual({
      ok: false,
      error: "Nominal melebihi batas Rp 220.000.",
    });
    expect(parseRupiahInput("999.999.999", { max: 220000, maxError: "Saldo kurang." })).toEqual({
      ok: false,
      error: "Saldo kurang.",
    });
  });
});

describe("formatRupiahInput", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1.000"],
    [2000000, "2.000.000"],
    [999999999999, "999.999.999.999"],
  ])("formats %d as %j", (value, expected) => {
    expect(formatRupiahInput(value)).toBe(expected);
  });

  it("round-trips through the parser", () => {
    for (const value of [1, 15000, 86900, 2000000, 123456789]) {
      expect(parseRupiahInput(formatRupiahInput(value))).toEqual({ ok: true, value });
    }
  });
});

describe("parseMoneyInput", () => {
  it("uses rupiah rules for IDR", () => {
    expect(parseMoneyInput("2.000.000", "IDR")).toEqual({ ok: true, value: 2000000 });
    expect(parseMoneyInput("15.000,50", "IDR").ok).toBe(false);
  });

  it.each([
    ["9.99", 9.99],
    ["1,234.5", 1234.5],
    ["$ 50", 50],
    ["12", 12],
  ])("parses USD %j as %d", (raw, expected) => {
    expect(parseMoneyInput(raw, "USD")).toEqual({ ok: true, value: expected });
  });

  it.each(["9.999", "9,99", "-5", "1e5", "abc", "0"])("rejects USD %j", (raw) => {
    expect(parseMoneyInput(raw, "USD").ok).toBe(false);
  });
});

describe("parseRupiahAmount (server)", () => {
  it("accepts whole positive numbers and digit strings", () => {
    expect(parseRupiahAmount(15000)).toEqual({ ok: true, value: 15000 });
    expect(parseRupiahAmount("15000")).toEqual({ ok: true, value: 15000 });
    expect(parseRupiahAmount("15.000")).toEqual({ ok: true, value: 15000 });
  });

  it.each([NaN, Infinity, -1, 0, 1.5, null, undefined, {}, "1e5", "15.000,50"])("rejects %j", (input) => {
    expect(parseRupiahAmount(input).ok).toBe(false);
  });

  it("applies the balance cap", () => {
    expect(parseRupiahAmount(999999999, { max: 220000, maxError: "Saldo tidak cukup." })).toEqual({
      ok: false,
      error: "Saldo tidak cukup.",
    });
  });
});

describe("parseRupiahTyping", () => {
  // What a field that regroups on every keystroke hands back: the previous
  // display plus one new key.
  function typeDigits(keys: string, insertAt?: (shown: string) => number) {
    let shown = "";
    for (const key of keys) {
      const at = insertAt ? insertAt(shown) : shown.length;
      const result = parseRupiahTyping(shown.slice(0, at) + key + shown.slice(at), { allowZero: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return shown;
      shown = formatRupiahInput(result.value);
    }
    return shown;
  }

  it.each([
    ["25000", "25.000"],
    ["1111111", "1.111.111"],
    ["2000000", "2.000.000"],
  ])("types %s digit by digit as %s", (keys, expected) => {
    expect(typeDigits(keys)).toBe(expected);
  });

  it("accepts a digit inserted in the middle of grouped text", () => {
    expect(parseRupiahTyping("2.5000")).toEqual({ ok: true, value: 25000 });
    expect(parseRupiahTyping("12.5000")).toEqual({ ok: true, value: 125000 });
    expect(parseRupiahTyping("1.11111")).toEqual({ ok: true, value: 111111 });
  });

  it("accepts a deletion that leaves dots out of place", () => {
    expect(parseRupiahTyping("2.00.000")).toEqual({ ok: true, value: 200000 });
    expect(parseRupiahTyping("Rp 1.2.3")).toEqual({ ok: true, value: 123 });
  });

  it.each([
    ["15.000,50", MONEY_ERRORS.decimalComma],
    ["-5", MONEY_ERRORS.negative],
    ["1e5", MONEY_ERRORS.notNumber],
    ["abc", MONEY_ERRORS.notNumber],
    [".", MONEY_ERRORS.grouping],
  ])("still rejects %s", (raw, error) => {
    expect(parseRupiahTyping(raw)).toEqual({ ok: false, error });
  });

  it("keeps the bounds checks", () => {
    expect(parseRupiahTyping("0")).toEqual({ ok: false, error: MONEY_ERRORS.zero });
    expect(parseRupiahTyping("1.000.000.000.0000").ok).toBe(false);
  });
});

describe("parseMoneyTyping", () => {
  it("relaxes grouping for rupiah only", () => {
    expect(parseMoneyTyping("2.5000", "IDR")).toEqual({ ok: true, value: 25000 });
    expect(parseMoneyTyping("10.05", "USD")).toEqual({ ok: true, value: 10.05 });
    expect(parseMoneyTyping("10.005", "USD").ok).toBe(false);
  });
});

describe("caretAfterDigits", () => {
  it.each([
    ["25.000", 0, 0],
    ["25.000", 2, 2],
    ["25.000", 3, 4],
    ["25.000", 5, 6],
    ["25.000", 9, 6],
    ["1.250.000", 4, 5],
  ])("in %s after %i digits is %i", (text, digits, pos) => {
    expect(caretAfterDigits(text, digits)).toBe(pos);
  });
});
