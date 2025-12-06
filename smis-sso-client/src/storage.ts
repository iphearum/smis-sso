import { Session, StorageAdapter } from './types';

export class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export const getDefaultStorage = (): StorageAdapter => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return new MemoryStorage();
};

export const storeSession = (
  storage: StorageAdapter,
  storageKey: string,
  session: Session | null
): void => {
  if (!session) {
    storage.removeItem(storageKey);
    return;
  }

  storage.setItem(storageKey, JSON.stringify(session));
};

export const readSession = (
  storage: StorageAdapter,
  storageKey: string
): Session | null => {
  const value = storage.getItem(storageKey);
  if (!value) return null;

  try {
    return JSON.parse(value) as Session;
  } catch (error) {
    storage.removeItem(storageKey);
    return null;
  }
};
