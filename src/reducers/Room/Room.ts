import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RoomState {
  roomCode: string | null;
  hostName: string | null;
  isHost: boolean;
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: RoomState = {
  roomCode: null,
  hostName: null,
  isHost: false,
  isConnected: false,
  connectionError: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    joinedRoom(state, action: PayloadAction<{ roomCode: string; hostName: string; isHost: boolean }>) {
      state.roomCode = action.payload.roomCode;
      state.hostName = action.payload.hostName;
      state.isHost = action.payload.isHost;
      state.isConnected = true;
      state.connectionError = null;
    },

    leftRoom(state) {
      state.roomCode = null;
      state.hostName = null;
      state.isHost = false;
      state.isConnected = false;
      state.connectionError = null;
    },

    setConnectionError(state, action: PayloadAction<string>) {
      state.connectionError = action.payload;
    },

    clearConnectionError(state) {
      state.connectionError = null;
    },
  },
});

export const { joinedRoom, leftRoom, setConnectionError, clearConnectionError } = roomSlice.actions;

export default roomSlice.reducer;
