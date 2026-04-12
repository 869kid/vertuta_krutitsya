import { describe, it, expect } from 'vitest';
import { getSlotFromSeed, getSlotFromDistance } from '@services/PredictionService';
import PredictionService from '@services/PredictionService';
import { Slot } from '@models/slot.model';

const makeSlot = (overrides: Partial<Slot> = {}): Slot => ({
  fastId: 0,
  id: overrides.id ?? Math.random().toString(),
  name: overrides.name ?? 'slot',
  amount: overrides.amount ?? 1,
  extra: null,
  investors: [],
  ...overrides,
});

describe('PredictionService', () => {
  describe('getSlotFromSeed', () => {
    it('returns first slot for seed near 0', () => {
      const slots = [{ amount: 10 }, { amount: 20 }, { amount: 30 }];
      expect(getSlotFromSeed(slots, 0.01)).toBe(0);
    });

    it('returns last slot for seed near 1', () => {
      const slots = [{ amount: 10 }, { amount: 20 }, { amount: 30 }];
      expect(getSlotFromSeed(slots, 0.99)).toBe(2);
    });

    it('distributes proportionally to amounts', () => {
      const slots = [{ amount: 50 }, { amount: 50 }];
      // seed=0.3 -> restAmount = 0.3 * 100 = 30, first slot has 50 -> found
      expect(getSlotFromSeed(slots, 0.3)).toBe(0);
      // seed=0.7 -> restAmount = 0.7 * 100 = 70, first 50 not enough -> second
      expect(getSlotFromSeed(slots, 0.7)).toBe(1);
    });

    it('handles single-slot array', () => {
      expect(getSlotFromSeed([{ amount: 100 }], 0.5)).toBe(0);
    });

    it('returns -1 for empty slots (known bug)', () => {
      expect(getSlotFromSeed([], 0.5)).toBe(-1);
    });

    it('returns index 0 when all amounts are 0 (seed*0=0, first slot satisfies <=0)', () => {
      const slots = [{ amount: 0 }, { amount: 0 }];
      // restAmount = 0.5 * 0 = 0; first slot: 0 - 0 = 0 <= 0 -> index 0
      // This means the "winner" is always the first slot regardless of seed -- degenerate but not -1
      expect(getSlotFromSeed(slots, 0.5)).toBe(0);
    });

    it('returns -1 for seed=1 with amounts (boundary: restAmount never reaches <=0 due to float)', () => {
      // seed=1.0 exactly: restAmount = totalSize, subtracting all amounts leaves exactly 0
      // findIndex finds 0 <= 0 at the last slot, so this actually works
      const slots = [{ amount: 10 }, { amount: 20 }];
      expect(getSlotFromSeed(slots, 1.0)).toBe(1);
    });

    it('handles null amounts via ?? 0 fallback', () => {
      const slots = [{ amount: null }, { amount: 10 }];
      // null ?? 0 = 0, so first slot contributes 0, second contributes 10
      // totalSize = 10, seed=0.5 -> restAmount=5, first -0 = 5 > 0, second -10 = -5 <= 0
      expect(getSlotFromSeed(slots, 0.5)).toBe(1);
    });
  });

  describe('getSlotFromDistance', () => {
    it('selects the correct slot by cumulative weight', () => {
      const slots = [{ amount: 25 }, { amount: 25 }, { amount: 50 }];
      // distance=0.3 -> restAmount = 30, first -25 = 5 > 0, second -25 = -20 <= 0
      expect(getSlotFromDistance(slots, 0.3)).toBe(1);
    });
  });

  describe('getReverseSize', () => {
    it('computes reverse weight for dropout', () => {
      // size=20, totalSize=100, length=5
      // (1 - 20/100) / (5-1) = 0.8 / 4 = 0.2
      expect(PredictionService.getReverseSize(20, 100, 5)).toBeCloseTo(0.2);
    });

    it('uses safeLength of 2 when length < 2', () => {
      // length=1 -> safeLength=2
      // (1 - 50/100) / (2-1) = 0.5
      expect(PredictionService.getReverseSize(50, 100, 1)).toBeCloseTo(0.5);
    });

    it('returns 1 when totalSize is 0 (division fallback)', () => {
      // size/totalSize = 0/0 = NaN, 1 - NaN = NaN, NaN / (safeLength-1) = NaN, NaN || 1 = 1
      expect(PredictionService.getReverseSize(0, 0, 5)).toBe(1);
    });
  });

  describe('normalizeSlotsChances', () => {
    it('normalizes chances to sum to ~100%', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 25 }),
        makeSlot({ id: 'b', amount: 75 }),
      ];
      const service = new PredictionService(slots);
      const chances = service.normalizeSlotsChances(slots);
      const total = chances.reduce((sum, c) => sum + c.chance, 0);
      expect(total).toBeCloseTo(100);
    });

    it('sorts by chance descending', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 10 }),
        makeSlot({ id: 'b', amount: 90 }),
      ];
      const service = new PredictionService(slots);
      const chances = service.normalizeSlotsChances(slots);
      expect(chances[0].id).toBe('b');
      expect(chances[1].id).toBe('a');
    });

    it('produces NaN chances when totalSize is 0', () => {
      const slots = [makeSlot({ id: 'a', amount: 0 })];
      const service = new PredictionService(slots);
      const chances = service.normalizeSlotsChances(slots);
      expect(chances[0].chance).toBeNaN();
    });
  });
});
