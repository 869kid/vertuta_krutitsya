import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'pointauc_custom_authors';
const DEFAULT_AUTHORS = ['Катя', 'Егор', 'Колян', 'Жека'];

const EMPTY_ARRAY: string[] = [];
let cachedRaw: string | null = null;
let cachedResult: string[] = EMPTY_ARRAY;

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const getSnapshot = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedResult;
    cachedRaw = raw;
    cachedResult = raw ? JSON.parse(raw) : EMPTY_ARRAY;
    return cachedResult;
  } catch {
    return EMPTY_ARRAY;
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Manages a list of predefined + user-added authors persisted in localStorage.
 * New custom authors are deduplicated against both default and existing custom lists.
 */
export const useAuthorHistory = () => {
  const customAuthors = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_ARRAY);

  const allAuthors = [...DEFAULT_AUTHORS, ...customAuthors.filter((a) => !DEFAULT_AUTHORS.includes(a))];

  const addAuthor = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const current = getSnapshot();
    const isDuplicate = DEFAULT_AUTHORS.includes(trimmed) || current.includes(trimmed);
    if (isDuplicate) return;

    const updated = [...current, trimmed];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  }, []);

  return { allAuthors, customAuthors, addAuthor };
};
