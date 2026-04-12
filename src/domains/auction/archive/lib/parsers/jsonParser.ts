import { ArchivedLot } from '@models/slot.model';

/**
 * Parses a JSON string into an ArchivedLot array.
 * Supports ArchiveData format `{ "lots": [...] }`, plain object arrays, and string arrays.
 * Returns null if the string is not valid JSON or does not resolve to a recognizable lot list.
 */
export function parseJSON(text: string): ArchivedLot[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);

    let items: unknown[];

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (!Array.isArray(obj.lots)) return null;
      items = obj.lots;
    } else if (Array.isArray(parsed)) {
      items = parsed;
    } else {
      return null;
    }

    return items
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim() ? ({ name: item.trim(), amount: 1, investors: [] } as ArchivedLot) : null;
        }
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : '';
        if (!name) return null;
        const rawAmount = Number(obj.amount);
        const amount = !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : 1;
        const investors = Array.isArray(obj.investors) ? (obj.investors as string[]) : [];
        return { name, amount, investors } as ArchivedLot;
      })
      .filter((item): item is ArchivedLot => item !== null);
  } catch {
    return null;
  }
}
