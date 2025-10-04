import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tweet } from '../features/timeline/types';

// タイムラインキャッシュのTTL（10分）
const TIMELINE_CACHE_TTL = 10 * 60 * 1000;

type TimelineCache = {
  type: string; // 'home' | 'following' など
  tweets: Tweet[];
  timestamp: number;
  cursor?: string;
};

type State = {
  cache: Map<string, TimelineCache>;
};

type Actions = {
  getTimeline: (type: string) => TimelineCache | null;
  setTimeline: (type: string, tweets: Tweet[], cursor?: string) => void;
  clearTimeline: (type: string) => void;
  clearExpiredCache: () => void;
};

export const useTimelineCacheStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      cache: new Map(),

      getTimeline: (type) => {
        const cached = get().cache.get(type);
        if (!cached) return null;

        // TTLチェック
        const now = Date.now();
        if (now - cached.timestamp > TIMELINE_CACHE_TTL) {
          get().clearTimeline(type);
          return null;
        }

        return cached;
      },

      setTimeline: (type, tweets, cursor) => {
        const cache = new Map(get().cache);
        cache.set(type, {
          type,
          tweets,
          timestamp: Date.now(),
          cursor,
        });
        set({ cache });
      },

      clearTimeline: (type) => {
        const cache = new Map(get().cache);
        cache.delete(type);
        set({ cache });
      },

      clearExpiredCache: () => {
        const cache = new Map(get().cache);
        const now = Date.now();
        let cleared = 0;

        for (const [type, entry] of cache.entries()) {
          if (now - entry.timestamp > TIMELINE_CACHE_TTL) {
            cache.delete(type);
            cleared++;
          }
        }

        if (cleared > 0) {
          set({ cache });
        }
      },
    }),
    {
      name: 'timeline-cache-storage',
      storage: createJSONStorage(() => sessionStorage), // セッションストレージを使用（タブ閉じたら消える）
      // MapをJSONに変換
      partialize: (state) => ({
        cache: Array.from(state.cache.entries()),
      }),
      // JSONからMapに復元
      merge: (persistedState, currentState) => {
        if (persistedState && typeof persistedState === 'object' && 'cache' in persistedState) {
          const cacheArray = persistedState.cache as Array<[string, TimelineCache]>;
          return {
            ...currentState,
            cache: new Map(cacheArray),
          };
        }
        return currentState;
      },
    }
  )
);
