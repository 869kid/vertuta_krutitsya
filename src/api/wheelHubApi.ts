import * as signalR from '@microsoft/signalr';

const API_BASE = import.meta.env.VITE_HISTORY_API_URL ?? 'http://localhost:8080';

export interface VariantDto {
  id: number;
  clientId: string;
  name: string;
  owner: string | null;
  isMultiLayer: boolean;
  parentId: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface JoinedRoomPayload {
  roomCode: string;
  hostName: string;
  isHost: boolean;
  variants: VariantDto[];
}

export interface WinRecordDto {
  id: number;
  lotName: string;
  owner: string;
  round: number;
  path: string[];
  timestamp: string;
  sessionId: string;
}

export interface RoomInfoDto {
  roomCode: string;
  hostName: string;
  hasPassword: boolean;
  variantCount: number;
  createdAt: string;
}

type EventCallback<T> = (data: T) => void;

let connection: signalR.HubConnection | null = null;

const listeners: {
  onJoinedRoom: EventCallback<JoinedRoomPayload>[];
  onVariantAdded: EventCallback<VariantDto>[];
  onVariantRemoved: EventCallback<number>[];
  onWinRecorded: EventCallback<WinRecordDto>[];
  onError: EventCallback<string>[];
} = {
  onJoinedRoom: [],
  onVariantAdded: [],
  onVariantRemoved: [],
  onWinRecorded: [],
  onError: [],
};

const buildConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/wheel`)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

const registerHandlers = (conn: signalR.HubConnection) => {
  conn.on('JoinedRoom', (data: JoinedRoomPayload) =>
    listeners.onJoinedRoom.forEach((cb) => cb(data)),
  );
  conn.on('VariantAdded', (data: VariantDto) =>
    listeners.onVariantAdded.forEach((cb) => cb(data)),
  );
  conn.on('VariantRemoved', (id: number) =>
    listeners.onVariantRemoved.forEach((cb) => cb(id)),
  );
  conn.on('WinRecorded', (data: WinRecordDto) =>
    listeners.onWinRecorded.forEach((cb) => cb(data)),
  );
  conn.on('Error', (msg: string) =>
    listeners.onError.forEach((cb) => cb(msg)),
  );
};

export const wheelHubApi = {
  async connect(): Promise<void> {
    if (connection?.state === signalR.HubConnectionState.Connected) return;

    connection = buildConnection();
    registerHandlers(connection);
    await connection.start();
  },

  async disconnect(): Promise<void> {
    if (!connection) return;
    await connection.stop();
    connection = null;
  },

  async joinRoom(roomCode: string, password?: string): Promise<void> {
    if (!connection) await this.connect();
    await connection!.invoke('JoinRoom', roomCode, password ?? null);
  },

  async leaveRoom(roomCode: string): Promise<void> {
    if (!connection) return;
    await connection.invoke('LeaveRoom', roomCode);
  },

  async addVariant(request: {
    roomCode: string;
    clientId: string;
    name: string;
    owner?: string;
    isMultiLayer: boolean;
    parentVariantId?: number | null;
  }): Promise<void> {
    if (!connection) return;
    await connection.invoke('AddVariant', {
      roomCode: request.roomCode,
      clientId: request.clientId,
      name: request.name,
      owner: request.owner ?? null,
      isMultiLayer: request.isMultiLayer,
      parentVariantId: request.parentVariantId ?? null,
    });
  },

  async removeVariant(roomCode: string, variantId: number): Promise<void> {
    if (!connection) return;
    await connection.invoke('RemoveVariant', { roomCode, variantId });
  },

  async recordWin(request: {
    roomCode: string;
    lotName: string;
    owner: string;
    round: number;
    path: string[];
    variantId: number;
  }): Promise<void> {
    if (!connection) return;
    await connection.invoke('RecordWin', request);
  },

  on<K extends keyof typeof listeners>(
    event: K,
    callback: (typeof listeners)[K][number],
  ): () => void {
    (listeners[event] as Array<typeof callback>).push(callback);
    return () => {
      const arr = listeners[event] as Array<typeof callback>;
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  },

  removeAllListeners(): void {
    listeners.onJoinedRoom = [];
    listeners.onVariantAdded = [];
    listeners.onVariantRemoved = [];
    listeners.onWinRecorded = [];
    listeners.onError = [];
  },

  isConnected(): boolean {
    return connection?.state === signalR.HubConnectionState.Connected;
  },
};

export const roomRestApi = {
  async createRoom(hostName: string, password?: string): Promise<RoomInfoDto> {
    const res = await fetch(`${API_BASE}/api/room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, password: password || null }),
    });
    if (!res.ok) throw new Error(`Failed to create room: ${res.status}`);
    return res.json();
  },

  async getRoom(roomCode: string): Promise<RoomInfoDto> {
    const res = await fetch(`${API_BASE}/api/room/${roomCode}`);
    if (!res.ok) throw new Error(`Room not found: ${res.status}`);
    return res.json();
  },

  async getRoomHistory(roomCode: string): Promise<WinRecordDto[]> {
    const res = await fetch(`${API_BASE}/api/room/${roomCode}/history`);
    if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
    return res.json();
  },
};
