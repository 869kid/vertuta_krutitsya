import { describe, it, expect } from 'vitest';
import { Slot } from '@models/slot.model';
import {
  calculateTotalLockedPercentage,
  calculateLockedAmount,
  recalculateAllLockedSlots,
} from '@utils/lockedPercentage.utils';

const makeSlot = (overrides: Partial<Slot> = {}): Slot => ({
  fastId: 0,
  id: overrides.id ?? '1',
  name: 'slot',
  amount: null,
  extra: null,
  investors: [],
  ...overrides,
});

describe('lockedPercentage.utils', () => {
  describe('calculateTotalLockedPercentage', () => {
    it('sums locked percentages', () => {
      const slots = [
        makeSlot({ lockedPercentage: 10 }),
        makeSlot({ lockedPercentage: 20 }),
        makeSlot({ lockedPercentage: 5 }),
      ];
      expect(calculateTotalLockedPercentage(slots)).toBe(35);
    });

    it('treats null/undefined lockedPercentage as 0', () => {
      const slots = [
        makeSlot({ lockedPercentage: 10 }),
        makeSlot({ lockedPercentage: null }),
        makeSlot({ lockedPercentage: undefined }),
      ];
      expect(calculateTotalLockedPercentage(slots)).toBe(10);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotalLockedPercentage([])).toBe(0);
    });
  });

  describe('calculateLockedAmount', () => {
    it('calculates correctly with normal values', () => {
      // totalOfOtherLots=100, lockedPercentage=20, totalLocked=20
      // => 100 * (20 / (100-20)) = 100 * 0.25 = 25
      expect(calculateLockedAmount(100, 20, 20)).toBe(25);
    });

    it('returns 0 when denominator (100 - totalLocked) is 0', () => {
      expect(calculateLockedAmount(100, 50, 100)).toBe(0);
    });

    it('returns 0 when denominator is negative', () => {
      expect(calculateLockedAmount(100, 50, 120)).toBe(0);
    });

    it('returns 0 when totalOfOtherLots is 0', () => {
      expect(calculateLockedAmount(0, 50, 50)).toBe(0);
    });
  });

  describe('recalculateAllLockedSlots', () => {
    it('returns original slots when no locked slots exist', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 10, lockedPercentage: 0 }),
        makeSlot({ id: 'b', amount: 20 }),
      ];
      const result = recalculateAllLockedSlots(slots);
      expect(result).toBe(slots);
    });

    it('returns original slots when total locked >= 100', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 10, lockedPercentage: 60 }),
        makeSlot({ id: 'b', amount: 20, lockedPercentage: 50 }),
      ];
      const result = recalculateAllLockedSlots(slots);
      expect(result).toBe(slots);
    });

    it('recalculates locked slot amounts based on unlocked total', () => {
      const slots = [
        makeSlot({ id: 'locked', amount: 0, lockedPercentage: 25 }),
        makeSlot({ id: 'free-1', amount: 30 }),
        makeSlot({ id: 'free-2', amount: 20 }),
      ];
      const result = recalculateAllLockedSlots(slots);
      const locked = result.find((s) => s.id === 'locked')!;
      // totalOfOtherLots = 50, totalLockedPct = 25
      // amount = 50 * (25 / (100 - 25)) = 50 * (25/75) ≈ 16.667
      expect(locked.amount).toBeCloseTo(16.667, 2);
    });

    it('respects extraLockedLot override', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 10, lockedPercentage: null }),
        makeSlot({ id: 'b', amount: 40 }),
      ];
      const result = recalculateAllLockedSlots(slots, { id: 'a', percentage: 30 });
      const slotA = result.find((s) => s.id === 'a')!;
      // 'a' now treated as 30% locked, totalOfOtherLots = 40, totalLockedPct = 30
      // amount = 40 * (30 / (100-30)) = 40 * (30/70) ≈ 17.143
      expect(slotA.amount).toBeCloseTo(17.143, 2);
    });

    it('does not mutate original slots', () => {
      const slots = [
        makeSlot({ id: 'locked', amount: 0, lockedPercentage: 25 }),
        makeSlot({ id: 'free', amount: 50 }),
      ];
      const originalAmount = slots[0].amount;
      recalculateAllLockedSlots(slots);
      expect(slots[0].amount).toBe(originalAmount);
    });

    it('handles slots with null amounts for unlocked lots', () => {
      const slots = [
        makeSlot({ id: 'locked', amount: 0, lockedPercentage: 50 }),
        makeSlot({ id: 'free', amount: null }),
      ];
      const result = recalculateAllLockedSlots(slots);
      const locked = result.find((s) => s.id === 'locked')!;
      // totalOfOtherLots = 0 (null amount, not > 0)
      expect(locked.amount).toBe(0);
    });
  });
});
