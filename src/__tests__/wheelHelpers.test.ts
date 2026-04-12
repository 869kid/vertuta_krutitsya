import { describe, it, expect } from 'vitest';
import wheelHelpers from '@domains/winner-selection/wheel-of-random/BaseWheel/helpers';
import { WheelItem } from '@models/wheel.model';

const { defineAngle, getWheelAngle } = wheelHelpers;

const makeWheelItem = (overrides: Partial<WheelItem> = {}): WheelItem => ({
  id: '1',
  name: 'item',
  color: '#000',
  amount: 1,
  ...overrides,
});

describe('wheelHelpers', () => {
  describe('defineAngle', () => {
    it('divides equally among items', () => {
      const items = [makeWheelItem({ id: '1' }), makeWheelItem({ id: '2' }), makeWheelItem({ id: '3' })];
      const result = defineAngle(items);
      const expectedAngle = (2 * Math.PI) / 3;

      expect(result).toHaveLength(3);
      result.forEach((item, i) => {
        expect(item.startAngle).toBeCloseTo(i * expectedAngle, 10);
        expect(item.endAngle).toBeCloseTo((i + 1) * expectedAngle, 10);
      });
    });

    it('gives a single item a full circle', () => {
      const items = [makeWheelItem()];
      const result = defineAngle(items);
      expect(result[0].startAngle).toBe(0);
      expect(result[0].endAngle).toBeCloseTo(2 * Math.PI, 10);
    });

    it('returns empty array for empty input', () => {
      expect(defineAngle([])).toEqual([]);
    });

    it('preserves item properties', () => {
      const items = [makeWheelItem({ id: 'test', name: 'Test', color: '#fff', amount: 42 })];
      const result = defineAngle(items);
      expect(result[0].id).toBe('test');
      expect(result[0].name).toBe('Test');
      expect(result[0].color).toBe('#fff');
      expect(result[0].amount).toBe(42);
    });

    it('ensures last segment ends at 2PI', () => {
      const items = Array.from({ length: 7 }, (_, i) => makeWheelItem({ id: String(i) }));
      const result = defineAngle(items);
      expect(result.at(-1)!.endAngle).toBeCloseTo(2 * Math.PI, 8);
    });
  });

  describe('getWheelAngle', () => {
    it('returns correct angle for 0 rotation', () => {
      // degree = 360 - 0 = 360, angle = (360 * PI/180) + 3PI/2 = 2PI + 3PI/2 = 7PI/2
      // 7PI/2 > 2PI -> 7PI/2 - 2PI = 3PI/2
      expect(getWheelAngle(0)).toBeCloseTo((3 * Math.PI) / 2, 10);
    });

    it('returns correct angle for 90 degrees', () => {
      // degree = 360 - 90 = 270, angle = (270 * PI/180) + 3PI/2 = 3PI/2 + 3PI/2 = 3PI
      // 3PI > 2PI -> 3PI - 2PI = PI
      expect(getWheelAngle(90)).toBeCloseTo(Math.PI, 10);
    });

    it('returns correct angle for 180 degrees', () => {
      // degree = 360 - 180 = 180, angle = PI + 3PI/2 = 5PI/2
      // 5PI/2 > 2PI -> 5PI/2 - 2PI = PI/2
      expect(getWheelAngle(180)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('wraps at 360 degrees', () => {
      // 360 and 0 should give the same result
      expect(getWheelAngle(360)).toBeCloseTo(getWheelAngle(0), 10);
    });

    it('handles large rotations (multiple full turns)', () => {
      expect(getWheelAngle(720)).toBeCloseTo(getWheelAngle(0), 10);
      expect(getWheelAngle(450)).toBeCloseTo(getWheelAngle(90), 10);
    });
  });
});
