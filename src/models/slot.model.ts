export interface Slot {
  fastId: number;
  id: string;
  name: string | null;
  amount: number | null;
  extra: number | null;
  investors?: string[];
  lockedPercentage?: number | null;
  isFavorite?: boolean;
  isMultiLayer?: boolean;
  children?: Slot[];
  owner?: string;
}

export type SlotResponse = Omit<Slot, 'extra'>;

export type ArchivedLot = Omit<Slot, 'extra' | 'id' | 'fastId'>;

export interface NavEntry {
  slotId: string;
  slotName: string;
}

export interface WinRecord {
  id: string;
  timestamp: number;
  path: string[];
  lotName: string;
  owner: string;
  round: number;
}
