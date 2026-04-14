import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RoomState {
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: RoomState = {
  isConnected: false,
  connectionError: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    connected(state) {
      state.isConnected = true;
      state.connectionError = null;
    },

    disconnected(state) {
      state.isConnected = false;
    },

    setConnectionError(state, action: PayloadAction<string>) {
      state.connectionError = action.payload;
    },

    clearConnectionError(state) {
      state.connectionError = null;
    },
  },
});

export const { connected, disconnected, setConnectionError, clearConnectionError } = roomSlice.actions;

export default roomSlice.reducer;
