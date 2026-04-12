import { describe, it, expect } from 'vitest';
import {
  isValidArchiveRecord,
  isValidArchiveData,
  isValidArchiveName,
} from '@domains/auction/archive/lib/validators';

describe('validators', () => {
  describe('isValidArchiveRecord', () => {
    const validRecord = {
      id: '123',
      name: 'My Save',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      data: '{}',
      isAutosave: false,
    };

    it('returns true for a valid record', () => {
      expect(isValidArchiveRecord(validRecord)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isValidArchiveRecord(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidArchiveRecord(undefined)).toBe(false);
    });

    it('returns false for a non-object', () => {
      expect(isValidArchiveRecord('string')).toBe(false);
      expect(isValidArchiveRecord(42)).toBe(false);
    });

    it('returns false when id is missing', () => {
      const { id, ...rest } = validRecord;
      expect(isValidArchiveRecord(rest)).toBe(false);
    });

    it('returns false when name is not a string', () => {
      expect(isValidArchiveRecord({ ...validRecord, name: 123 })).toBe(false);
    });

    it('returns false when isAutosave is not boolean', () => {
      expect(isValidArchiveRecord({ ...validRecord, isAutosave: 'false' })).toBe(false);
    });

    it('returns false when data is not a string', () => {
      expect(isValidArchiveRecord({ ...validRecord, data: {} })).toBe(false);
    });
  });

  describe('isValidArchiveData', () => {
    it('returns true for valid JSON with lots array', () => {
      const data = JSON.stringify({ lots: [{ name: 'A', amount: 1 }] });
      expect(isValidArchiveData(data)).toBe(true);
    });

    it('returns true when lot has null name and null amount', () => {
      const data = JSON.stringify({ lots: [{ name: null, amount: null }] });
      expect(isValidArchiveData(data)).toBe(true);
    });

    it('returns true for empty lots array', () => {
      expect(isValidArchiveData(JSON.stringify({ lots: [] }))).toBe(true);
    });

    it('returns false for invalid JSON', () => {
      expect(isValidArchiveData('{bad json')).toBe(false);
    });

    it('returns false when lots is not an array', () => {
      expect(isValidArchiveData(JSON.stringify({ lots: 'not array' }))).toBe(false);
    });

    it('returns false when lot has numeric name', () => {
      expect(isValidArchiveData(JSON.stringify({ lots: [{ name: 123, amount: 1 }] }))).toBe(false);
    });

    it('returns false when lot has string amount', () => {
      expect(isValidArchiveData(JSON.stringify({ lots: [{ name: 'A', amount: '10' }] }))).toBe(false);
    });

    it('returns false when lots contains a non-object', () => {
      expect(isValidArchiveData(JSON.stringify({ lots: ['string'] }))).toBe(false);
    });

    it('returns false for a primitive JSON value', () => {
      expect(isValidArchiveData('42')).toBe(false);
    });
  });

  describe('isValidArchiveName', () => {
    it('returns true for a normal name', () => {
      expect(isValidArchiveName('My Save')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidArchiveName('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(isValidArchiveName('   ')).toBe(false);
    });

    it('returns false for name exceeding 100 characters', () => {
      expect(isValidArchiveName('a'.repeat(101))).toBe(false);
    });

    it('returns true for name at exactly 100 characters', () => {
      expect(isValidArchiveName('a'.repeat(100))).toBe(true);
    });

    it('returns true for single character', () => {
      expect(isValidArchiveName('A')).toBe(true);
    });
  });
});
