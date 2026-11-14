export interface SplitBillRecord {
  id: string;
  creator_id: string;
  title: string;
  split_mode: "itemized" | "equal";
  tax_percentage: number;
  service_percentage: number;
  discount_amount: number;
  extra_fee: number;
  rounding_step: number;
  payment_info: {
    method?: string;
    account_number?: string;
    account_name?: string;
    note?: string;
  };
  category: string;
  logged_expense_id?: string | null;
  status: "active" | "settled";
  created_at: string;
  updated_at?: string;
}

export interface SplitParticipantRecord {
  id: string;
  bill_id: string;
  name: string;
  is_creator: boolean;
  is_paid: boolean;
  paid_at?: string | null;
}

export interface SplitItemRecord {
  id: string;
  bill_id?: string;
  name: string;
  price: number;
  quantity: number;
  assigned_participant_ids: string[];
}

export interface ParticipantItemBreakdown {
  itemId: string;
  name: string;
  shareAmount: number;
  quantity: number;
  splitBetweenCount: number;
}

export interface ParticipantCalculation {
  participantId: string;
  name: string;
  isCreator: boolean;
  itemsSubtotal: number;
  taxShare: number;
  serviceShare: number;
  discountShare: number;
  feeShare: number;
  /** totalOwed minus the rounded lines above it, so a breakdown always adds up to its total. */
  roundingShare: number;
  totalOwed: number;
  isPaid: boolean;
  items: ParticipantItemBreakdown[];
}

export interface SplitCalculationSummary {
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  extraFee: number;
  grandTotal: number;
  /** Sum of every share minus the exact bill total: the "Pembulatan" line. */
  roundingDiff: number;
  /** Itemized items nobody is assigned to. Their cost is in no one's share. */
  unassignedItems: { itemId: string; name: string; total: number }[];
  participants: ParticipantCalculation[];
}

/** Itemized items that nobody is assigned to (assignees that aren't participants don't count). */
export function findUnassignedItems<T extends { assigned_participant_ids: string[] }>(
  items: T[],
  participantIds: string[]
): T[] {
  const known = new Set(participantIds);
  return items.filter((item) => !(item.assigned_participant_ids || []).some((id) => known.has(id)));
}

/**
 * Pure deterministic calculation engine for split bills.
 * Distributes proportional tax, service charge, extra fees, and discounts.
 */
export function calculateSplitBreakdown(
  bill: {
    split_mode: "itemized" | "equal";
    tax_percentage: number;
    service_percentage: number;
    discount_amount: number;
    extra_fee: number;
    rounding_step?: number;
  },
  items: SplitItemRecord[],
  participants: SplitParticipantRecord[]
): SplitCalculationSummary {
  const numParticipants = Math.max(1, participants.length);
  const taxRate = Math.max(0, Number(bill.tax_percentage || 0)) / 100;
  const serviceRate = Math.max(0, Number(bill.service_percentage || 0)) / 100;
  const discountTotal = Math.max(0, Number(bill.discount_amount || 0));
  const feeTotal = Math.max(0, Number(bill.extra_fee || 0));
  const roundingStep = bill.rounding_step ?? 100;

  // Initialize participant breakdown map
  const participantMap = new Map<string, ParticipantCalculation>();
  participants.forEach((p) => {
    participantMap.set(p.id, {
      participantId: p.id,
      name: p.name,
      isCreator: Boolean(p.is_creator),
      itemsSubtotal: 0,
      taxShare: 0,
      serviceShare: 0,
      discountShare: 0,
      feeShare: 0,
      roundingShare: 0,
      totalOwed: 0,
      isPaid: Boolean(p.is_paid),
      items: [],
    });
  });

  // Calculate items subtotal and per-participant allocations
  let overallSubtotal = 0;
  const unassignedItems: SplitCalculationSummary["unassignedItems"] = [];

  if (bill.split_mode === "equal") {
    // In equal mode, sum all items and divide equally
    overallSubtotal = items.reduce(
      (sum, item) => sum + Math.max(0, Number(item.price || 0)) * Math.max(1, Number(item.quantity || 1)),
      0
    );
    const equalShare = overallSubtotal / numParticipants;

    participants.forEach((p) => {
      const calc = participantMap.get(p.id);
      if (calc) {
        calc.itemsSubtotal = equalShare;
        calc.items = items.map((item) => ({
          itemId: item.id,
          name: item.name,
          shareAmount: (item.price * item.quantity) / numParticipants,
          quantity: item.quantity,
          splitBetweenCount: numParticipants,
        }));
      }
    });
  } else {
    // In itemized mode, assign items to specific participant(s)
    items.forEach((item) => {
      const itemTotal = Math.max(0, Number(item.price || 0)) * Math.max(1, Number(item.quantity || 1));
      overallSubtotal += itemTotal;

      // Only assignees who are participants of this bill. An item with none stays
      // unassigned: it is never spread over everyone behind the host's back.
      const assigned = (item.assigned_participant_ids || []).filter((pId) => participantMap.has(pId));
      if (assigned.length === 0) {
        unassignedItems.push({ itemId: item.id, name: item.name, total: itemTotal });
        return;
      }

      const splitCount = assigned.length;
      const sharePerPerson = itemTotal / splitCount;

      assigned.forEach((pId) => {
        const calc = participantMap.get(pId);
        if (calc) {
          calc.itemsSubtotal += sharePerPerson;
          calc.items.push({
            itemId: item.id,
            name: item.name,
            shareAmount: sharePerPerson,
            quantity: item.quantity,
            splitBetweenCount: splitCount,
          });
        }
      });
    });
  }

  // Calculate overall tax and service
  const overallTax = overallSubtotal * taxRate;
  const overallService = overallSubtotal * serviceRate;

  // Distribute tax, service, discount, and extra fees proportionally
  const effectiveSubtotal = overallSubtotal > 0 ? overallSubtotal : 1;
  let runningGrandTotal = 0;

  const resultParticipants: ParticipantCalculation[] = [];

  participants.forEach((p) => {
    const calc = participantMap.get(p.id)!;
    // Ratio of this participant's subtotal to the bill subtotal
    const ratio = overallSubtotal > 0 ? calc.itemsSubtotal / effectiveSubtotal : 1 / numParticipants;

    calc.taxShare = Math.round(overallTax * ratio);
    calc.serviceShare = Math.round(overallService * ratio);
    calc.discountShare = Math.round(discountTotal * ratio);
    calc.feeShare = Math.round(feeTotal / numParticipants); // fees (like delivery) are typically shared equally per person

    const shownLinesTotal =
      Math.round(calc.itemsSubtotal) + calc.taxShare + calc.serviceShare + calc.feeShare - calc.discountShare;
    const rawOwed = Math.max(
      0,
      calc.itemsSubtotal + calc.taxShare + calc.serviceShare + calc.feeShare - calc.discountShare
    );

    // Rounding per person to nearest rounding step (e.g. 100 or 500 IDR)
    if (roundingStep > 1) {
      calc.totalOwed = Math.round(rawOwed / roundingStep) * roundingStep;
    } else {
      calc.totalOwed = Math.round(rawOwed);
    }
    calc.roundingShare = calc.totalOwed - shownLinesTotal;

    runningGrandTotal += calc.totalOwed;
    resultParticipants.push(calc);
  });

  const calculatedGrandTotal = Math.max(
    0,
    overallSubtotal + overallTax + overallService + feeTotal - discountTotal
  );
  // The part of the bill that sits on unassigned items (with their tax and service).
  const unassignedSubtotal = unassignedItems.reduce((sum, it) => sum + it.total, 0);
  const unassignedAmount = unassignedSubtotal * (1 + taxRate + serviceRate);
  const allocatedExact = Math.round(calculatedGrandTotal - unassignedAmount);

  return {
    subtotal: Math.round(overallSubtotal),
    taxAmount: Math.round(overallTax),
    serviceAmount: Math.round(overallService),
    discountAmount: Math.round(discountTotal),
    extraFee: Math.round(feeTotal),
    grandTotal: runningGrandTotal > 0 ? runningGrandTotal : Math.round(calculatedGrandTotal),
    roundingDiff: unassignedItems.length > 0 ? 0 : runningGrandTotal - allocatedExact,
    unassignedItems,
    participants: resultParticipants,
  };
}

/**
 * Client-side LocalStorage cache manager for split calculations.
 * Calculates once, caches in browser, and serves instantly on repeat visits.
 */
// v2: results carry roundingShare and unassignedItems; older cached results don't.
const CACHE_PREFIX = "pet_split_calc_v2_";
const DRAFT_KEY = "pet_split_creator_draft";

export function getCachedOrCalculateSplit(
  bill: SplitBillRecord,
  items: SplitItemRecord[],
  participants: SplitParticipantRecord[]
): SplitCalculationSummary {
  if (typeof window === "undefined") {
    return calculateSplitBreakdown(bill, items, participants);
  }

  const cacheKey = `${CACHE_PREFIX}${bill.id}_${bill.updated_at || bill.created_at}`;

  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.participants)) {
        return parsed as SplitCalculationSummary;
      }
    }
  } catch (err) {
    console.warn("Failed to read split bill cache from localStorage", err);
  }

  // Calculate once
  const result = calculateSplitBreakdown(bill, items, participants);

  // Write to localStorage for instant subsequent loads
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (err) {
    console.warn("Failed to write split bill cache to localStorage", err);
  }

  return result;
}

export function invalidateSplitCache(billId: string) {
  if (typeof window === "undefined") return;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${CACHE_PREFIX}${billId}`)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn("Failed to invalidate split cache", err);
  }
}

export function saveSplitDraft(draft: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn("Failed to save draft", err);
  }
}

export function loadSplitDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const data = window.localStorage.getItem(DRAFT_KEY);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export function clearSplitDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
