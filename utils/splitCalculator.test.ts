import { describe, expect, it } from "vitest";
import {
  calculateSplitBreakdown,
  findUnassignedItems,
  type ParticipantCalculation,
  type SplitItemRecord,
  type SplitParticipantRecord,
} from "@/utils/splitCalculator";

const part = (id: string, name: string, isCreator = false): SplitParticipantRecord => ({
  id,
  bill_id: "b",
  name,
  is_creator: isCreator,
  is_paid: isCreator,
});

const item = (id: string, name: string, price: number, assigned: string[], quantity = 1): SplitItemRecord => ({
  id,
  name,
  price,
  quantity,
  assigned_participant_ids: assigned,
});

const itemized = (overrides: Partial<{ tax_percentage: number; service_percentage: number; discount_amount: number; extra_fee: number; rounding_step: number }> = {}) => ({
  split_mode: "itemized" as const,
  tax_percentage: 0,
  service_percentage: 0,
  discount_amount: 0,
  extra_fee: 0,
  rounding_step: 100,
  ...overrides,
});

/** The lines a breakdown shows, as the viewer rounds them, plus the rounding line. */
const shownSum = (p: ParticipantCalculation) =>
  Math.round(p.itemsSubtotal) + p.taxShare + p.serviceShare + p.feeShare - p.discountShare + p.roundingShare;

describe("unassigned items (A002-04)", () => {
  const host = part("h", "Saya", true);
  const rina = part("r", "Rina");
  const dimas = part("d", "Dimas");
  const items = [
    item("i1", "Nasi", 30000, ["h", "r", "d"]),
    item("i2", "Ayam bakar", 32000, ["r"]),
    item("i3", "Es teh", 6000, ["h", "d"]),
  ];

  it("keeps an item whose only assignee was removed out of everyone's share", () => {
    // Rina removed: her id is gone from participants but still on the item.
    const result = calculateSplitBreakdown(itemized(), items, [host, dimas]);

    expect(result.unassignedItems).toEqual([{ itemId: "i2", name: "Ayam bakar", total: 32000 }]);
    const hostShare = result.participants.find((p) => p.participantId === "h")!;
    const dimasShare = result.participants.find((p) => p.participantId === "d")!;
    // Nasi stays shared by the two still on it (15.000 each), Es teh 3.000 each.
    // Ayam bakar, Rina's alone, is in nobody's share.
    expect(hostShare.itemsSubtotal).toBeCloseTo(18000);
    expect(dimasShare.itemsSubtotal).toBeCloseTo(18000);
  });

  it("does not spread an item with an empty assignment over everyone", () => {
    const result = calculateSplitBreakdown(itemized(), [item("i1", "Pizza", 90000, [])], [host, rina, dimas]);
    expect(result.unassignedItems).toHaveLength(1);
    expect(result.participants.every((p) => p.totalOwed === 0)).toBe(true);
  });

  it("findUnassignedItems ignores assignees who aren't participants", () => {
    expect(findUnassignedItems(items, ["h", "d"]).map((i) => i.id)).toEqual(["i2"]);
    expect(findUnassignedItems(items, ["h", "r", "d"])).toEqual([]);
  });

  it("equal mode never reports unassigned items", () => {
    const result = calculateSplitBreakdown({ ...itemized(), split_mode: "equal" }, [item("i1", "Pizza", 90000, [])], [host, rina, dimas]);
    expect(result.unassignedItems).toEqual([]);
    expect(result.participants.map((p) => p.totalOwed)).toEqual([30000, 30000, 30000]);
  });
});

describe("rounding line (A002-35)", () => {
  const people = [part("h", "Saya", true), part("r", "Rina"), part("d", "Dimas")];

  it("makes every person's breakdown add up to their total", () => {
    const result = calculateSplitBreakdown(
      itemized({ tax_percentage: 10, service_percentage: 5 }),
      [item("i1", "Nasi", 25000, ["h", "r", "d"]), item("i2", "Sate", 31000, ["r", "d"]), item("i3", "Teh", 7000, ["h"])],
      people
    );
    for (const p of result.participants) {
      expect(shownSum(p)).toBe(p.totalOwed);
    }
  });

  it("reports the gap between the rounded shares and the exact bill", () => {
    // The audit's bill: subtotal 87.000, tax 8.700, service 4.350 = 100.050 exact.
    const result = calculateSplitBreakdown(
      itemized({ tax_percentage: 10, service_percentage: 5 }),
      [item("i1", "A", 33000, ["h"]), item("i2", "B", 43000, ["r"]), item("i3", "C", 11000, ["d"])],
      people
    );
    const exact = result.subtotal + result.taxAmount + result.serviceAmount + result.extraFee - result.discountAmount;
    expect(exact).toBe(100050);
    expect(result.grandTotal).toBe(result.participants.reduce((s, p) => s + p.totalOwed, 0));
    expect(result.grandTotal - result.roundingDiff).toBe(exact);
  });

  it("has no rounding line when the step is exact", () => {
    const result = calculateSplitBreakdown(
      itemized({ rounding_step: 1 }),
      [item("i1", "A", 10000, ["h", "r", "d"])],
      people
    );
    expect(result.roundingDiff).toBe(Math.round(result.participants.reduce((s, p) => s + p.totalOwed, 0)) - 10000);
    for (const p of result.participants) expect(shownSum(p)).toBe(p.totalOwed);
  });
});
