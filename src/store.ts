import { configureStore, type Reducer } from '@reduxjs/toolkit';
import { AnyAction, Middleware } from 'redux';
import thunk from 'redux-thunk';
import { throttle } from '@tanstack/react-pacer';

import { setSlots, slotsSlice } from '@reducers/Slots/Slots.ts';
import { recalculateAllLockedSlots } from '@utils/lockedPercentage.utils.ts';
import { sortSlots } from '@utils/common.utils.ts';
import { isBrowser } from '@utils/ssr.ts';
import { Slot } from '@models/slot.model.ts';
import archiveApi from '@domains/auction/archive/api/IndexedDBAdapter';
import { slotsToArchivedLots } from '@domains/auction/archive/lib/converters';

import type { RootState } from '@reducers/index.ts';

const MATRYOSHKA_STORAGE_KEY = 'matryoshka-state';

const SORTABLE_SLOT_EVENTS = [
  'slots/setSlotData',
  'slots/setSlotAmount',
  'slots/addExtra',
  'slots/deleteSlot',
  'slots/addSlot',
  'slots/addSlotAmount',
  'slots/mergeLot',
  'slots/setLockedPercentage',
  'slots/setSlotIsFavorite',
];

const sortSlotsMiddleware: Middleware<{}, RootState> =
  (storeApi) =>
  (next) =>
  (action): AnyAction => {
    const result = next(action);
    if (SORTABLE_SLOT_EVENTS.includes(action.type)) {
      const { slots } = storeApi.getState().slots;
      const updatedSlots = recalculateAllLockedSlots(slots);
      const sortedSlots = sortSlots(updatedSlots);

      return next(setSlots(sortedSlots));
    }
    return result;
  };

let _slotsUpdateEvents: string[] | null = null;
const getSlotsUpdateEvents = () => {
  if (!_slotsUpdateEvents) {
    _slotsUpdateEvents = Object.keys(slotsSlice.actions).map((actionName) => `${slotsSlice.name}/${actionName}`);
  }
  return _slotsUpdateEvents;
};

const saveSlotsWithCooldown = throttle(
  (slots: Slot[]) => {
    if (!isBrowser) return;
    const lots = slotsToArchivedLots(slots);
    archiveApi
      .upsertAutosave({ lots })
      .catch((err: unknown) => console.error('Autosave failed:', err));
  },
  { wait: 2000, trailing: true, leading: false },
);

const saveSlotsMiddleware: Middleware<{}, RootState> =
  (storeApi) =>
  (next) =>
  (action): AnyAction => {
    const result = next(action);
    const { slots, isInitialized } = storeApi.getState().slots;
    if (isInitialized && getSlotsUpdateEvents().includes(action.type)) {
      saveSlotsWithCooldown(slots);
    }
    return result;
  };

const MATRYOSHKA_PERSIST_EVENTS = [
  'matryoshka/recordWin',
  'matryoshka/nextRound',
  'matryoshka/clearHistory',
  'matryoshka/loadHistory',
  'matryoshka/loadRound',
];

const saveMatryoshkaWithCooldown = throttle(
  (matryoshkaState: RootState['matryoshka']) => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(
        MATRYOSHKA_STORAGE_KEY,
        JSON.stringify({
          history: matryoshkaState.history,
          currentRound: matryoshkaState.currentRound,
        }),
      );
    } catch (err) {
      console.error('Matryoshka save failed:', err);
    }
  },
  { wait: 1000, trailing: true, leading: false },
);

const matryoshkaPersistMiddleware: Middleware<{}, RootState> =
  (storeApi) =>
  (next) =>
  (action): AnyAction => {
    const result = next(action);
    if (MATRYOSHKA_PERSIST_EVENTS.includes(action.type)) {
      saveMatryoshkaWithCooldown(storeApi.getState().matryoshka);
    }
    return result;
  };

export function loadMatryoshkaState(): { history: any[]; currentRound: number } | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(MATRYOSHKA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted data
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let store: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initStore(rootReducer: Reducer<any>) {
  store = configureStore({
    reducer: rootReducer,
    middleware: [thunk, sortSlotsMiddleware, saveSlotsMiddleware, matryoshkaPersistMiddleware],
  });
  return store;
}
