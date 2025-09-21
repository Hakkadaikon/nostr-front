import localforage from 'localforage';

export interface StorageDriver {
  getItem<T = any>(key: string): Promise<T | null>;
  setItem<T = any>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class LocalForageDriver implements StorageDriver {
  constructor() {
    localforage.config({ name: 'nostr-web-client' });
  }
  async getItem<T>(key: string) {
    return (await localforage.getItem<T>(key)) ?? null;
  }
  async setItem<T>(key: string, value: T) {
    await localforage.setItem(key, value as any);
  }
  async removeItem(key: string) {
    await localforage.removeItem(key);
  }
}

class MemoryDriver implements StorageDriver {
  private m = new Map<string, any>();
  async getItem<T>(key: string) { return (this.m.has(key) ? this.m.get(key) : null) as T | null; }
  async setItem<T>(key: string, value: T) { this.m.set(key, value); }
  async removeItem(key: string) { this.m.delete(key); }
}

let driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (driver) return driver;
  try {
    // localforage uses IndexedDB when available
    driver = new LocalForageDriver();
  } catch {
    driver = new MemoryDriver();
  }
  return driver;
}
