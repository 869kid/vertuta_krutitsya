import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Slot } from '@models/slot.model.ts';
import { getRandomIntInclusive, sortSlots } from '@utils/common.utils.ts';
import { recalculateAllLockedSlots } from '@utils/lockedPercentage.utils';

import slotNamesMap from '../../services/SlotNamesMap';

interface SlotsState {
  slots: Slot[];
  searchTerm: string;
  isInitialized: boolean;
}

let maxFastId = 0;

export const createSlot = (props: Partial<Slot> = {}): Slot => {
  const slot = {
    // eslint-disable-next-line no-plusplus
    fastId: ++maxFastId,
    id: Math.random().toString(),
    extra: null,
    amount: null,
    name: '',
    investors: [],
    lockedPercentage: null,
    isFavorite: false,
    ...props,
  };

  slotNamesMap.set(`#${slot.fastId}`, slot.id);

  return slot;
};

export const createRandomSlots = (count: number, max: number, min = 1): Slot[] =>
  sortSlots(
    Array(count)
      .fill(null)
      .map(() => {
        const amount = getRandomIntInclusive(min, max);

        return createSlot({ amount, name: amount.toString() });
      }),
  );

export const updateFastIdCounter = (slots: Slot[]): void => {
  maxFastId = Math.max(...slots.map(({ fastId }) => fastId));
};

export const initialSlots = [createSlot()];
updateFastIdCounter(initialSlots);
slotNamesMap.setFromList(initialSlots);

const initialState: SlotsState = {
  searchTerm: '',
  slots: initialSlots,
  isInitialized: false,
};

const updateSlotPosition = (slots: Slot[], index: number): void => {
  if (Number(slots[index].amount) >= Number(slots[0].amount)) {
    slots.unshift(slots.splice(index, 1)[0]);
  }
};

const updateSlotAmount = (slots: Slot[], updatedId: string | number, transform: (slot: Slot) => Slot): void => {
  const updatedIndex = slots.findIndex(({ id }) => updatedId === id);

  slots[updatedIndex] = transform(slots[updatedIndex]);
  updateSlotPosition(slots, updatedIndex);
};

const updateSlotIsFavorite = (slots: Slot[], slotId: string | number, state: boolean) => {
  const index = slots.findIndex(({ id }) => slotId === id);

  if (index === -1) {
    return;
  }

  slots[index].isFavorite = state;
};

export const slotsSlice = createSlice({
  name: 'slots',
  initialState,
  reducers: {
    setSlotData(state, action: PayloadAction<Partial<Slot>>): void {
      const { id, ...rest } = action.payload;
      state.slots = state.slots.map((slot) => (slot.id === id ? { ...slot, ...rest } : slot));
    },
    setSlotName(state, action: PayloadAction<{ id: string; name: string }>): void {
      const { id, name } = action.payload;
      state.slots = state.slots.map((slot) => {
        if (slot.id === id && slot.name != null) {
          slotNamesMap.updateName(slot.name, name, slot.id);

          return { ...slot, name };
        }

        return slot;
      });
    },
    addSlotAmount(state, action: PayloadAction<{ id: string | number; amount: number }>): void {
      const { id, amount } = action.payload;
      updateSlotAmount(state.slots, id, (slot) => ({ ...slot, amount: (slot.amount || 0) + amount }));
    },
    setSlotAmount(state, action: PayloadAction<{ id: string | number; amount: number }>): void {
      const { id, amount } = action.payload;
      updateSlotAmount(state.slots, id, (slot) => ({ ...slot, amount }));
    },
    setLotPercentage(state, action: PayloadAction<{ id: string | number; percentage: number }>): void {
      const { id, percentage } = action.payload;
      state.slots = sortSlots(recalculateAllLockedSlots(state.slots, { id, percentage }));
    },
    setSlotExtra(state, action: PayloadAction<{ id: string | number; extra: number }>): void {
      const { id, extra } = action.payload;
      state.slots = state.slots.map((slot) => (slot.id === id ? { ...slot, extra } : slot));
    },
    setSlotIsFavorite(state, action: PayloadAction<{ id: string | number; state: boolean }>): void {
      const { id, state: favoriteState } = action.payload;
      updateSlotIsFavorite(state.slots, id, favoriteState);
    },
    addExtra(state, action: PayloadAction<{ id: string | number; extra: number }>): void {
      const { id, extra } = action.payload;
      updateSlotAmount(state.slots, id, (slot) => ({ ...slot, extra: null, amount: Number(slot.amount ?? 0) + extra }));
    },
    deleteSlot(state, action: PayloadAction<string>): void {
      const deletedId = action.payload;
      slotNamesMap.deleteBySlotId(deletedId);

      if (state.slots.length === 1) {
        state.slots = [createSlot()];
      } else {
        state.slots = state.slots.filter(({ id }) => deletedId !== id);
      }
    },
    addSlot(state, action: PayloadAction<Partial<Slot>>): void {
      const newSlot = createSlot(action?.payload);
      state.slots = [...state.slots, newSlot];
      slotNamesMap.set(`#${maxFastId}`, newSlot.id);
    },
    resetSlots(state): void {
      slotNamesMap.clear();
      state.slots = [createSlot({ fastId: 1 })];
      updateFastIdCounter(state.slots);
    },
    setSlots(state, action: PayloadAction<Slot[]>): void {
      state.slots = action.payload;
    },
    setSlotsInitialized(state): void {
      state.isInitialized = true;
    },
    setSearchTerm(state, action: PayloadAction<string>): void {
      state.searchTerm = action.payload;
    },
    setLockedPercentage(state, action: PayloadAction<{ id: string; percentage: number }>): void {
      const { id, percentage } = action.payload;
      state.slots = state.slots.map((slot) => (slot.id === id ? { ...slot, lockedPercentage: percentage } : slot));
    },
    unlockPercentage(state, action: PayloadAction<string>): void {
      const id = action.payload;
      state.slots = state.slots.map((slot) => (slot.id === id ? { ...slot, lockedPercentage: null } : slot));
    },
    mergeLot(state, action: PayloadAction<{ query: Record<string, string>; lot: Partial<Slot> & { amountChange?: number } }>): void {
      const { query, lot: requestLot } = action.payload;
      const compare = (lot: Slot) => {
        if (query.id) return lot.id === query.id;
        return false;
      };
      const updateLot = (lot: Slot): Slot => ({
        ...lot,
        ...requestLot,
        amount:
          requestLot.amountChange != null && lot.amount
            ? lot.amount + requestLot.amountChange
            : requestLot.amount ?? lot.amount ?? null,
      });

      state.slots = state.slots.map((lot) => (compare(lot) ? updateLot(lot) : lot));
      state.slots = recalculateAllLockedSlots(state.slots);
    },
  },
});

export const {
  setSlotData,
  setSlotAmount,
  setSlotExtra,
  setSlotName,
  setSlotIsFavorite,
  addExtra,
  addSlot,
  deleteSlot,
  resetSlots,
  setSlots,
  setSlotsInitialized,
  addSlotAmount,
  setLotPercentage,
  setSearchTerm,
  mergeLot,
  setLockedPercentage,
  unlockPercentage,
} = slotsSlice.actions;

export default slotsSlice.reducer;
