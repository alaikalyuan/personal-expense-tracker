import { describe, expect, it } from "vitest";
import { DEFAULT_SPLIT_CONFIG, normalizeSplitConfig, toDbSplitConfig, withNormalizedSplitConfig } from "./splitConfig";

describe("toDbSplitConfig", () => {
  it("converts the client payload to snake_case keys", () => {
    expect(
      toDbSplitConfig({
        splitMode: "equal",
        friends: [{ name: "Budi" }, { name: "Sari" }],
        autoCreateSplitBill: true,
        autoLogToExpenses: false,
      })
    ).toEqual({
      split_mode: "equal",
      friends: [{ name: "Budi" }, { name: "Sari" }],
      auto_create_split_bill: true,
      auto_log_to_expenses: false,
    });
  });

  it("keeps both boxes unticked", () => {
    const db = toDbSplitConfig({
      splitMode: "custom",
      friends: [{ name: "Budi", share: 20000 }],
      autoCreateSplitBill: false,
      autoLogToExpenses: false,
    });
    expect(db.auto_create_split_bill).toBe(false);
    expect(db.auto_log_to_expenses).toBe(false);
    expect(db.split_mode).toBe("custom");
    expect(db.friends).toEqual([{ name: "Budi", share: 20000 }]);
  });

  it("stores no camelCase keys", () => {
    const db = toDbSplitConfig({
      splitMode: "equal",
      friends: [],
      autoCreateSplitBill: true,
      autoLogToExpenses: true,
    });
    expect(Object.keys(db).sort()).toEqual(
      ["auto_create_split_bill", "auto_log_to_expenses", "friends", "split_mode"]
    );
  });

  it("uses the column default when the payload has no config", () => {
    expect(toDbSplitConfig(undefined)).toEqual(DEFAULT_SPLIT_CONFIG);
  });
});

describe("normalizeSplitConfig", () => {
  it("reads rows stored with camelCase keys", () => {
    expect(
      normalizeSplitConfig({
        splitMode: "equal",
        friends: [{ name: "Budi" }],
        autoCreateSplitBill: true,
        autoLogToExpenses: false,
      })
    ).toEqual({
      split_mode: "equal",
      friends: [{ name: "Budi" }],
      auto_create_split_bill: true,
      auto_log_to_expenses: false,
    });
  });

  it("prefers snake_case keys when both are present", () => {
    const c = normalizeSplitConfig({
      auto_create_split_bill: false,
      autoCreateSplitBill: true,
      auto_log_to_expenses: true,
      autoLogToExpenses: false,
    });
    expect(c.auto_create_split_bill).toBe(false);
    expect(c.auto_log_to_expenses).toBe(true);
  });

  it.each([null, undefined, "x", 3])("falls back to the default for %j", (raw) => {
    expect(normalizeSplitConfig(raw)).toEqual(DEFAULT_SPLIT_CONFIG);
  });

  it("drops malformed friends and non-numeric shares", () => {
    expect(
      normalizeSplitConfig({ friends: [{ name: "Budi", share: "x" }, null, 4, { name: 7 }] }).friends
    ).toEqual([{ name: "Budi" }, { name: "" }]);
  });

  it("does not share the default friends array between results", () => {
    normalizeSplitConfig(null).friends.push({ name: "x" });
    expect(DEFAULT_SPLIT_CONFIG.friends).toEqual([]);
  });
});

describe("withNormalizedSplitConfig", () => {
  it("keeps other fields and normalises split_config", () => {
    const row = { id: "1", name: "Spotify", split_config: { autoCreateSplitBill: false } };
    expect(withNormalizedSplitConfig(row)).toEqual({
      id: "1",
      name: "Spotify",
      split_config: { ...DEFAULT_SPLIT_CONFIG, auto_create_split_bill: false },
    });
  });
});
