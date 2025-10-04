import { create } from 'zustand';
import type { Event as NostrEvent } from 'nostr-tools';
import type { NotificationUser } from '../types/notification';

// ノートキャッシュのTTL（5分）
const NOTE_CACHE_TTL = 5 * 60 * 1000;

type CachedNote = {
  note: NostrEvent;
  author?: NotificationUser;
  timestamp: number;
};

type State = {
  cache: Map<string, CachedNote>;
};

type Actions = {
  /**
   * キャッシュからノートを取得
   */
  getNote: (noteId: string) => CachedNote | null;

  /**
   * ノートをキャッシュに保存
   */
  setNote: (noteId: string, note: NostrEvent, author?: NotificationUser) => void;

  /**
   * 期限切れキャッシュをクリア
   */
  clearExpiredCache: () => void;

  /**
   * 特定のノートをキャッシュから削除
   */
  clearNote: (noteId: string) => void;
};

export const useNoteCacheStore = create<State & Actions>((set, get) => ({
  cache: new Map(),

  getNote: (noteId) => {
    const cached = get().cache.get(noteId);
    if (!cached) return null;

    // TTLチェック
    const now = Date.now();
    if (now - cached.timestamp > NOTE_CACHE_TTL) {
      get().clearNote(noteId);
      return null;
    }

    return cached;
  },

  setNote: (noteId, note, author) => {
    const cache = new Map(get().cache);
    cache.set(noteId, {
      note,
      author,
      timestamp: Date.now(),
    });
    set({ cache });
  },

  clearExpiredCache: () => {
    const cache = new Map(get().cache);
    const now = Date.now();
    let cleared = 0;

    for (const [noteId, entry] of cache.entries()) {
      if (now - entry.timestamp > NOTE_CACHE_TTL) {
        cache.delete(noteId);
        cleared++;
      }
    }

    if (cleared > 0) {
      set({ cache });
    }
  },

  clearNote: (noteId) => {
    const cache = new Map(get().cache);
    cache.delete(noteId);
    set({ cache });
  },
}));
