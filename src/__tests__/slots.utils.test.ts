import { describe, it, expect, vi } from 'vitest';
import { Slot } from '@models/slot.model';
import { getTotalSize, getWinnerSlot, parseSlotsPreset, SlotListToWheelList } from '@utils/slots.utils';

const makeSlot = (overrides: Partial<Slot> = {}): Slot => ({
  fastId: 0,
  id: overrides.id ?? '1',
  name: overrides.name ?? 'slot',
  amount: overrides.amount ?? 1,
  extra: null,
  investors: [],
  ...overrides,
});

describe('slots.utils', () => {
  describe('getTotalSize', () => {
    it('sums all amounts', () => {
      const slots = [{ amount: 10 }, { amount: 20 }, { amount: 30 }];
      expect(getTotalSize(slots)).toBe(60);
    });

    it('treats null amount as 0 (via Number(null) = 0)', () => {
      const slots = [{ amount: null as unknown as number }, { amount: 10 }];
      expect(getTotalSize(slots)).toBe(10);
    });

    it('returns 0 for empty array', () => {
      expect(getTotalSize([])).toBe(0);
    });

    it('handles undefined amount producing NaN', () => {
      const slots = [{ amount: undefined as unknown as number }, { amount: 10 }];
      // Number(undefined) = NaN, NaN + 10 = NaN
      expect(getTotalSize(slots)).toBeNaN();
    });
  });

  describe('getWinnerSlot', () => {
    it('returns the slot with the highest amount', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 10 }),
        makeSlot({ id: 'b', amount: 50 }),
        makeSlot({ id: 'c', amount: 30 }),
      ];
      expect(getWinnerSlot(slots).id).toBe('b');
    });

    it('returns the last slot with the highest amount when there are ties', () => {
      const slots = [
        makeSlot({ id: 'a', amount: 50 }),
        makeSlot({ id: 'b', amount: 50 }),
      ];
      // reduce picks >= current, so b wins (last tie wins)
      expect(getWinnerSlot(slots).id).toBe('b');
    });

    it('works with a single slot', () => {
      const slots = [makeSlot({ id: 'only' })];
      expect(getWinnerSlot(slots).id).toBe('only');
    });
  });

  describe('parseSlotsPreset', () => {
    it('parses multiline text into slots', () => {
      const result = parseSlotsPreset('Item A,10\nItem B,20');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Item A');
      expect(result[0].amount).toBe(10);
      expect(result[1].name).toBe('Item B');
      expect(result[1].amount).toBe(20);
    });

    it('defaults amount to 1 when not provided', () => {
      const result = parseSlotsPreset('Item A');
      expect(result[0].amount).toBe(1);
    });

    it('assigns incremental fastId values', () => {
      const result = parseSlotsPreset('A\nB\nC');
      expect(result[0].fastId).toBe(0);
      expect(result[1].fastId).toBe(1);
      expect(result[2].fastId).toBe(2);
    });

    it('generates unique ids', () => {
      const result = parseSlotsPreset('A\nB');
      expect(result[0].id).not.toBe(result[1].id);
    });
  });

  describe('SlotListToWheelList', () => {
    it('converts all slots to wheel items with amount: 1', () => {
      const slots = [
        makeSlot({ id: 'a', name: 'A', amount: 100 }),
        makeSlot({ id: 'b', name: 'B', amount: 200 }),
      ];
      const result = SlotListToWheelList(slots);
      expect(result).toHaveLength(2);
      result.forEach((item) => {
        expect(item.amount).toBe(1);
      });
    });

    it('returns empty array for empty input', () => {
      expect(SlotListToWheelList([])).toEqual([]);
    });

    it('preserves slot id and name', () => {
      const slots = [makeSlot({ id: 'test-id', name: 'Test Name' })];
      const result = SlotListToWheelList(slots);
      expect(result[0].id).toBe('test-id');
      expect(result[0].name).toBe('Test Name');
    });

    it('handles slot with null name gracefully', () => {
      const slots = [makeSlot({ id: 'a', name: null })];
      const result = SlotListToWheelList(slots);
      expect(result[0].name).toBe('');
    });

    it('assigns colors to each item', () => {
      const slots = [makeSlot({ id: 'a' }), makeSlot({ id: 'b' })];
      const result = SlotListToWheelList(slots);
      result.forEach((item) => {
        expect(item.color).toBeDefined();
        expect(typeof item.color).toBe('string');
      });
    });
  });
});
