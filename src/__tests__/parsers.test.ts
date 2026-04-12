import { describe, it, expect } from 'vitest';
import { parseCSV, lotsToCSV, CSV_DELIMITER } from '@domains/auction/archive/lib/parsers/csvParser';
import { parseJSON } from '@domains/auction/archive/lib/parsers/jsonParser';

describe('csvParser', () => {
  describe('parseCSV', () => {
    it('parses lines with name|cost format', () => {
      const result = parseCSV('Item A|10\nItem B|20');
      expect(result).toEqual([
        { name: 'Item A', amount: 10, investors: [] },
        { name: 'Item B', amount: 20, investors: [] },
      ]);
    });

    it('defaults cost to 1 when no delimiter', () => {
      const result = parseCSV('Item A\nItem B');
      expect(result).toEqual([
        { name: 'Item A', amount: 1, investors: [] },
        { name: 'Item B', amount: 1, investors: [] },
      ]);
    });

    it('defaults cost to 1 for invalid cost', () => {
      const result = parseCSV('Item A|abc');
      expect(result).toEqual([{ name: 'Item A', amount: 1, investors: [] }]);
    });

    it('defaults cost to 1 for zero or negative cost', () => {
      expect(parseCSV('Item|0')[0].amount).toBe(1);
      expect(parseCSV('Item|-5')[0].amount).toBe(1);
    });

    it('skips empty lines', () => {
      const result = parseCSV('Item A\n\n  \nItem B');
      expect(result).toHaveLength(2);
    });

    it('handles pipe in name (uses lastIndexOf)', () => {
      const result = parseCSV('A|B item|10');
      expect(result[0].name).toBe('A|B item');
      expect(result[0].amount).toBe(10);
    });

    it('skips lines where name is empty after delimiter', () => {
      const result = parseCSV('|10');
      expect(result).toHaveLength(0);
    });

    it('trims whitespace from lines', () => {
      const result = parseCSV('  Item A|10  ');
      expect(result[0].name).toBe('Item A');
      expect(result[0].amount).toBe(10);
    });
  });

  describe('lotsToCSV', () => {
    it('serializes lots to CSV format', () => {
      const lots = [
        { name: 'Item A', amount: 10, investors: [] },
        { name: 'Item B', amount: 20, investors: [] },
      ];
      expect(lotsToCSV(lots)).toBe(`Item A${CSV_DELIMITER}10\nItem B${CSV_DELIMITER}20`);
    });

    it('defaults empty name to empty string and null amount to 1', () => {
      const lots = [{ name: null as unknown as string, amount: null as unknown as number, investors: [] }];
      expect(lotsToCSV(lots)).toBe(`${CSV_DELIMITER}1`);
    });
  });

  describe('round-trip CSV', () => {
    it('preserves data through serialize -> parse', () => {
      const original = [
        { name: 'Item A', amount: 10, investors: [] },
        { name: 'Item B', amount: 1, investors: [] },
      ];
      const csv = lotsToCSV(original);
      const parsed = parseCSV(csv);
      expect(parsed).toEqual(original);
    });
  });
});

describe('jsonParser', () => {
  describe('parseJSON', () => {
    it('parses { lots: [...] } format', () => {
      const json = JSON.stringify({ lots: [{ name: 'A', amount: 1, investors: [] }] });
      const result = parseJSON(json);
      expect(result).toEqual([{ name: 'A', amount: 1, investors: [] }]);
    });

    it('parses plain array of objects', () => {
      const json = JSON.stringify([{ name: 'A', amount: 5 }]);
      const result = parseJSON(json);
      expect(result).toEqual([{ name: 'A', amount: 5 }]);
    });

    it('parses array of strings into lots with amount 1', () => {
      const json = JSON.stringify(['Item A', 'Item B']);
      const result = parseJSON(json);
      expect(result).toEqual([
        { name: 'Item A', amount: 1, investors: [] },
        { name: 'Item B', amount: 1, investors: [] },
      ]);
    });

    it('returns null for non-JSON text', () => {
      expect(parseJSON('just plain text')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(parseJSON('{broken')).toBeNull();
    });

    it('returns null for object without lots property', () => {
      expect(parseJSON(JSON.stringify({ items: [] }))).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseJSON('')).toBeNull();
    });

    it('returns null for primitive JSON values', () => {
      expect(parseJSON('42')).toBeNull();
      expect(parseJSON('"string"')).toBeNull();
    });

    it('handles whitespace around JSON', () => {
      const json = `  ${JSON.stringify({ lots: [{ name: 'A' }] })}  `;
      const result = parseJSON(json);
      expect(result).toHaveLength(1);
    });

    it('passes non-string objects through without validation (known limitation)', () => {
      const json = JSON.stringify([{ garbage: true, notALot: 123 }]);
      const result = parseJSON(json);
      expect(result).toHaveLength(1);
      expect((result![0] as any).garbage).toBe(true);
    });
  });
});
