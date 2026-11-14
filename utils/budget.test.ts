import { describe, expect, it } from "vitest";
import {
  budgetOrNull,
  dailyAllowance,
  daysBetweenInclusive,
  daysElapsedInPeriod,
  daysLeftInPeriod,
  periodKindOf,
  resolveBudgets,
} from "@/utils/budget";

const base = { multiSakuEnabled: false, selectedSakuId: "all", totalDaysInMonth: 30 };

describe("budgetOrNull", () => {
  it("treats missing, zero, negative and junk values as not set", () => {
    for (const v of [null, undefined, "", 0, -5, "abc"]) expect(budgetOrNull(v)).toBeNull();
  });
  it("keeps positive numbers and numeric strings", () => {
    expect(budgetOrNull(300000)).toBe(300000);
    expect(budgetOrNull("150000")).toBe(150000);
  });
});

describe("resolveBudgets", () => {
  it("returns null for both periods when no budget was ever set", () => {
    expect(resolveBudgets({ ...base, wallets: [] })).toEqual({ weeklyBudget: null, monthlyBudget: null });
    expect(
      resolveBudgets({
        ...base,
        fallbackWallet: { kind: "spending", weekly_budget: null, monthly_budget: null },
      })
    ).toEqual({ weeklyBudget: null, monthlyBudget: null });
  });

  it("never invents Rp 500.000", () => {
    const r = resolveBudgets({ ...base, wallets: [{ id: "a", kind: "spending" }] });
    expect(r.weeklyBudget).toBeNull();
    expect(r.monthlyBudget).toBeNull();
  });

  it("derives the monthly budget from a weekly one", () => {
    const r = resolveBudgets({
      ...base,
      fallbackWallet: { kind: "spending", weekly_budget: 70000, monthly_budget: null },
    });
    expect(r).toEqual({ weeklyBudget: 70000, monthlyBudget: 300000 });
  });

  it("keeps a monthly-only budget without inventing a weekly one", () => {
    const r = resolveBudgets({
      ...base,
      fallbackWallet: { kind: "spending", weekly_budget: null, monthly_budget: 1200000 },
    });
    expect(r).toEqual({ weeklyBudget: null, monthlyBudget: 1200000 });
  });

  it("gives a savings (stash) Saku no spending budget", () => {
    const r = resolveBudgets({
      ...base,
      multiSakuEnabled: true,
      selectedSakuId: "s",
      wallets: [{ id: "s", kind: "stash", weekly_budget: 100000, monthly_budget: null }],
    });
    expect(r).toEqual({ weeklyBudget: null, monthlyBudget: null });
  });

  it("uses the selected spending Saku's own budget", () => {
    const r = resolveBudgets({
      ...base,
      multiSakuEnabled: true,
      selectedSakuId: "b",
      wallets: [
        { id: "a", kind: "spending", weekly_budget: 100000 },
        { id: "b", kind: "spending", weekly_budget: null },
      ],
    });
    expect(r).toEqual({ weeklyBudget: null, monthlyBudget: null });
  });

  it("sums only spending Saku that have a budget in the 'all' view", () => {
    const r = resolveBudgets({
      ...base,
      multiSakuEnabled: true,
      wallets: [
        { id: "a", kind: "spending", weekly_budget: 70000 },
        { id: "b", kind: "spending", weekly_budget: null, monthly_budget: 600000 },
        { id: "c", kind: "spending" },
        { id: "s", kind: "stash", weekly_budget: 999999 },
      ],
    });
    expect(r).toEqual({ weeklyBudget: 70000, monthlyBudget: 300000 + 600000 });
  });

  it("returns null in the 'all' view when no spending Saku has a budget", () => {
    const r = resolveBudgets({
      ...base,
      multiSakuEnabled: true,
      wallets: [{ id: "a", kind: "spending" }, { id: "s", kind: "stash" }],
    });
    expect(r).toEqual({ weeklyBudget: null, monthlyBudget: null });
  });
});

describe("daysLeftInPeriod", () => {
  // 13 Nov 2026 is a Friday.
  const friday = new Date(2026, 10, 13, 10, 0, 0);
  it("counts today and the rest of the week", () => {
    expect(daysLeftInPeriod("week", friday, 30)).toBe(3);
    expect(daysLeftInPeriod("week", new Date(2026, 10, 15), 30)).toBe(1); // Sunday
    expect(daysLeftInPeriod("week", new Date(2026, 10, 9), 30)).toBe(7); // Monday
  });
  it("counts today and the rest of the month", () => {
    expect(daysLeftInPeriod("month", friday, 30)).toBe(18);
    expect(daysLeftInPeriod("month", new Date(2026, 10, 30), 30)).toBe(1);
  });
});

describe("dailyAllowance", () => {
  it("spreads what was left at the start of today over the remaining days", () => {
    expect(dailyAllowance(1200000, 52786, 18)).toBeCloseTo(63734.1, 0);
  });
  it("is the same figure whatever was spent today", () => {
    // Spending today lowers "left today", not the allowance itself.
    const allowance = dailyAllowance(300000, 100000, 4);
    expect(allowance).toBe(50000);
  });
});

describe("days in a period", () => {
  it("counts inclusive calendar days across month ends", () => {
    expect(daysBetweenInclusive("2026-11-09", "2026-11-15")).toBe(7);
    expect(daysBetweenInclusive("2026-10-26", "2026-11-01")).toBe(7);
    expect(daysBetweenInclusive("2026-11-01", "2026-11-30")).toBe(30);
  });

  it("counts elapsed days up to today in the current period", () => {
    expect(daysElapsedInPeriod("2026-11-09", "2026-11-15", "2026-11-13")).toBe(5);
    expect(daysElapsedInPeriod("2026-11-01", "2026-11-30", "2026-11-13")).toBe(13);
  });

  it("counts a finished period in full and a future one as one day", () => {
    expect(daysElapsedInPeriod("2026-10-26", "2026-11-01", "2026-11-13")).toBe(7);
    expect(daysElapsedInPeriod("2026-12-01", "2026-12-31", "2026-11-13")).toBe(1);
  });

  it("tells a weekly recap from a monthly one", () => {
    expect(periodKindOf("2026-11-09", "2026-11-15")).toBe("week");
    expect(periodKindOf("2026-11-01", "2026-11-30")).toBe("month");
  });
});
