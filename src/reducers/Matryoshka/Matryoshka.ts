import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NavEntry, WinRecord, Slot } from '@models/slot.model';
import {
  removeLotByIdInTree,
  cleanEmptyMultiLayerLots,
  navStackToParentPath,
} from '@utils/matryoshka.utils';

export interface MatryoshkaState {
  navigationStack: NavEntry[];
  history: WinRecord[];
  currentRound: number;
  winner: Slot | null;
  isSpinning: boolean;
}

const initialState: MatryoshkaState = {
  navigationStack: [],
  history: [],
  currentRound: 1,
  winner: null,
  isSpinning: false,
};

let recordCounter = 0;

const matryoshkaSlice = createSlice({
  name: 'matryoshka',
  initialState,
  reducers: {
    navigateInto(state, action: PayloadAction<{ slotId: string; slotName: string }>) {
      state.navigationStack.push({
        slotId: action.payload.slotId,
        slotName: action.payload.slotName,
      });
      state.winner = null;
    },

    navigateBackTo(state, action: PayloadAction<number>) {
      state.navigationStack = state.navigationStack.slice(0, action.payload);
      state.winner = null;
    },

    setWinner(state, action: PayloadAction<Slot | null>) {
      state.winner = action.payload;
    },

    setSpinning(state, action: PayloadAction<boolean>) {
      state.isSpinning = action.payload;
    },

    recordWin(state, action: PayloadAction<{ lot: Slot; path: string[] }>) {
      const record: WinRecord = {
        id: `${Date.now()}-${++recordCounter}`,
        timestamp: Date.now(),
        path: action.payload.path,
        lotName: action.payload.lot.name || '(unnamed)',
        owner: action.payload.lot.owner || '',
        round: state.currentRound,
      };
      state.history.unshift(record);
    },

    nextRound(state) {
      state.currentRound += 1;
      state.winner = null;
    },

    clearHistory(state) {
      state.history = [];
    },

    resetMatryoshka(state) {
      state.navigationStack = [];
      state.winner = null;
      state.isSpinning = false;
    },

    loadHistory(state, action: PayloadAction<WinRecord[]>) {
      state.history = action.payload;
    },

    loadRound(state, action: PayloadAction<number>) {
      state.currentRound = action.payload;
    },
  },
});

export const {
  navigateInto,
  navigateBackTo,
  setWinner,
  setSpinning,
  recordWin,
  nextRound,
  clearHistory,
  resetMatryoshka,
  loadHistory,
  loadRound,
} = matryoshkaSlice.actions;

export default matryoshkaSlice.reducer;
