import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import slotsReducer, {
  slotsSlice,
  deleteSlot,
  addSlot,
  setSlotAmount,
  addSlotAmount,
  setSlotName,
  setSlotData,
  mergeLot,
  setSlots,
  resetSlots,
  setSlotIsFavorite,
  setLotPercentage,
  createSlot,
} from '@reducers/Slots/Slots';
import { Slot } from '@models/slot.model';

const makeSlot = (overrides: Partial<Slot> = {}): Slot => ({
  fastId: 99,
  id: overrides.id ?? 'test-id',
  name: overrides.name ?? 'Test',
  amount: overrides.amount ?? 10,
  extra: null,
  investors: [],
  ...overrides,
});

const createStore = (slots?: Slot[]) => {
  const store = configureStore({ reducer: { slots: slotsReducer } });
  if (slots) {
    store.dispatch(setSlots(slots));
  }
  return store;
};

describe('Slots reducer', () => {
  describe('deleteSlot', () => {
    it('removes a slot by id', () => {
      const store = createStore([makeSlot({ id: 'a' }), makeSlot({ id: 'b' }), makeSlot({ id: 'c' })]);
      store.dispatch(deleteSlot('b'));
      const ids = store.getState().slots.slots.map((s) => s.id);
      expect(ids).toEqual(['a', 'c']);
    });

    it('replaces with a fresh slot when deleting the last one', () => {
      const store = createStore([makeSlot({ id: 'only' })]);
      store.dispatch(deleteSlot('only'));
      const slots = store.getState().slots.slots;
      expect(slots).toHaveLength(1);
      expect(slots[0].id).not.toBe('only');
      expect(slots[0].name).toBe('');
    });
  });

  describe('addSlot', () => {
    it('appends a new slot', () => {
      const store = createStore([makeSlot({ id: 'a' })]);
      store.dispatch(addSlot({ name: 'New' }));
      const slots = store.getState().slots.slots;
      expect(slots).toHaveLength(2);
      expect(slots[1].name).toBe('New');
    });
  });

  describe('setSlotAmount', () => {
    it('sets the amount for an existing slot', () => {
      const store = createStore([makeSlot({ id: 'a', amount: 10 })]);
      store.dispatch(setSlotAmount({ id: 'a', amount: 50 }));
      expect(store.getState().slots.slots[0].amount).toBe(50);
    });

    it('does nothing when slot id does not exist', () => {
      const store = createStore([makeSlot({ id: 'a', amount: 10 })]);
      store.dispatch(setSlotAmount({ id: 'nonexistent', amount: 99 }));
      expect(store.getState().slots.slots).toHaveLength(1);
      expect(store.getState().slots.slots[0].amount).toBe(10);
    });
  });

  describe('addSlotAmount', () => {
    it('adds to the existing amount', () => {
      const store = createStore([makeSlot({ id: 'a', amount: 10 })]);
      store.dispatch(addSlotAmount({ id: 'a', amount: 5 }));
      expect(store.getState().slots.slots[0].amount).toBe(15);
    });

    it('treats null amount as 0 when adding', () => {
      const store = createStore([makeSlot({ id: 'a', amount: null })]);
      store.dispatch(addSlotAmount({ id: 'a', amount: 5 }));
      expect(store.getState().slots.slots[0].amount).toBe(5);
    });
  });

  describe('setSlotName', () => {
    it('updates the name of a slot', () => {
      const store = createStore([makeSlot({ id: 'a', name: 'Old' })]);
      store.dispatch(setSlotName({ id: 'a', name: 'New Name' }));
      expect(store.getState().slots.slots[0].name).toBe('New Name');
    });
  });

  describe('setSlotData', () => {
    it('merges partial data into a slot', () => {
      const store = createStore([makeSlot({ id: 'a', name: 'Old', amount: 10 })]);
      store.dispatch(setSlotData({ id: 'a', name: 'Updated' }));
      const slot = store.getState().slots.slots[0];
      expect(slot.name).toBe('Updated');
      expect(slot.amount).toBe(10);
    });
  });

  describe('mergeLot', () => {
    it('merges data into a matching lot', () => {
      const store = createStore([makeSlot({ id: 'a', name: 'Original', amount: 10 })]);
      store.dispatch(mergeLot({ query: { id: 'a' }, lot: { name: 'Merged' } }));
      expect(store.getState().slots.slots[0].name).toBe('Merged');
    });

    it('applies amountChange additively', () => {
      const store = createStore([makeSlot({ id: 'a', amount: 10 })]);
      store.dispatch(mergeLot({ query: { id: 'a' }, lot: { amountChange: 5 } }));
      expect(store.getState().slots.slots[0].amount).toBe(15);
    });

    it('does nothing when query.id is empty string (known limitation)', () => {
      const store = createStore([makeSlot({ id: 'a', name: 'Unchanged' })]);
      store.dispatch(mergeLot({ query: { id: '' }, lot: { name: 'Should not apply' } }));
      expect(store.getState().slots.slots[0].name).toBe('Unchanged');
    });

    it('does nothing when no id matches', () => {
      const store = createStore([makeSlot({ id: 'a', name: 'Same' })]);
      store.dispatch(mergeLot({ query: { id: 'nonexistent' }, lot: { name: 'Nope' } }));
      expect(store.getState().slots.slots[0].name).toBe('Same');
    });
  });

  describe('setSlotIsFavorite', () => {
    it('sets favorite state', () => {
      const store = createStore([makeSlot({ id: 'a', isFavorite: false })]);
      store.dispatch(setSlotIsFavorite({ id: 'a', state: true }));
      expect(store.getState().slots.slots[0].isFavorite).toBe(true);
    });

    it('handles non-existent slot id gracefully (has -1 guard)', () => {
      const store = createStore([makeSlot({ id: 'a' })]);
      store.dispatch(setSlotIsFavorite({ id: 'nonexistent', state: true }));
      expect(store.getState().slots.slots[0].isFavorite).toBeFalsy();
    });
  });

  describe('resetSlots', () => {
    it('replaces all slots with a single fresh slot', () => {
      const store = createStore([makeSlot({ id: 'a' }), makeSlot({ id: 'b' })]);
      store.dispatch(resetSlots());
      const slots = store.getState().slots.slots;
      expect(slots).toHaveLength(1);
      expect(slots[0].name).toBe('');
    });
  });

  describe('setLotPercentage', () => {
    it('recalculates locked slots', () => {
      const store = createStore([
        makeSlot({ id: 'locked', amount: 0, lockedPercentage: null }),
        makeSlot({ id: 'free', amount: 100, lockedPercentage: null }),
      ]);
      store.dispatch(setLotPercentage({ id: 'locked', percentage: 25 }));
      const locked = store.getState().slots.slots.find((s) => s.id === 'locked')!;
      // With 25% locked and 100 free: lockedAmount = 100 * (25 / 75) ≈ 33.33
      expect(locked.amount).toBeCloseTo(33.33, 1);
    });
  });

  describe('createSlot', () => {
    it('creates a slot with defaults', () => {
      const slot = createSlot();
      expect(slot.name).toBe('');
      expect(slot.amount).toBeNull();
      expect(slot.extra).toBeNull();
      expect(slot.investors).toEqual([]);
      expect(typeof slot.id).toBe('string');
      expect(typeof slot.fastId).toBe('number');
    });

    it('merges provided overrides', () => {
      const slot = createSlot({ name: 'Custom', amount: 42 });
      expect(slot.name).toBe('Custom');
      expect(slot.amount).toBe(42);
    });
  });
});
