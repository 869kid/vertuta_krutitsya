import axios from 'axios';

const API_BASE = import.meta.env.VITE_HISTORY_API_URL || '';

const api = axios.create({ baseURL: API_BASE });

export interface WinRecordDto {
  id: number;
  lotName: string;
  owner: string;
  round: number;
  path: string[];
  timestamp: string;
  sessionId: string;
}

export interface SessionDto {
  id: number;
  sessionId: string;
  name: string;
  createdAt: string;
  totalRounds: number;
  winCount: number;
}

export interface SessionDetailDto {
  id: number;
  sessionId: string;
  name: string;
  createdAt: string;
  totalRounds: number;
  winRecords: WinRecordDto[];
}

export interface StatsDto {
  totalSessions: number;
  totalWins: number;
  totalRounds: number;
  topWinners: Record<string, number>;
  topLots: Record<string, number>;
}

const SESSION_KEY = 'vertuta-session-id';

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const historyApi = {
  getSessionId: getOrCreateSessionId,

  newSession(): void {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    localStorage.setItem(SESSION_KEY, id);
  },

  async recordWin(data: {
    lotName: string;
    owner: string;
    round: number;
    path: string[];
  }): Promise<void> {
    try {
      await api.post('/api/history', {
        ...data,
        sessionId: getOrCreateSessionId(),
      });
    } catch (err) {
      console.warn('Failed to sync win to server:', err);
    }
  },

  async getHistory(sessionId?: string): Promise<WinRecordDto[]> {
    const params: Record<string, string> = {};
    if (sessionId) params.sessionId = sessionId;
    const { data } = await api.get<WinRecordDto[]>('/api/history', { params });
    return data;
  },

  async clearHistory(sessionId?: string): Promise<void> {
    const params: Record<string, string> = {};
    if (sessionId) params.sessionId = sessionId;
    await api.delete('/api/history', { params });
  },

  async getSessions(): Promise<SessionDto[]> {
    const { data } = await api.get<SessionDto[]>('/api/sessions');
    return data;
  },

  async getSession(sessionId: string): Promise<SessionDetailDto> {
    const { data } = await api.get<SessionDetailDto>(`/api/sessions/${sessionId}`);
    return data;
  },

  async getStats(): Promise<StatsDto> {
    const { data } = await api.get<StatsDto>('/api/stats');
    return data;
  },
};
