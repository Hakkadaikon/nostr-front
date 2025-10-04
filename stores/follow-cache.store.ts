import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// フォローリストキャッシュのTTL（5分）
const FOLLOW_LIST_CACHE_TTL = 5 * 60 * 1000;

type FollowListCache = {
  pubkey: string;
  followList: string[];
  timestamp: number;
  kind: number; // KIND_FOLLOW (3) or KIND_PEOPLE_LIST (30000)
};

type State = {
  cache: Map<string, FollowListCache>;
};

type Actions = {
  getFollowList: (pubkey: string) => { followList: string[]; kind: number } | null;
  setFollowList: (pubkey: string, followList: string[], kind: number) => void;
  clearFollowList: (pubkey: string) => void;
  clearExpiredCache: () => void;
};

export const useFollowCacheStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      cache: new Map(),

      getFollowList: (pubkey) => {
        const cached = get().cache.get(pubkey);
        if (!cached) return null;

        // TTLチェック
        const now = Date.now();
        if (now - cached.timestamp > FOLLOW_LIST_CACHE_TTL) {
          console.log('[FollowCache] Cache expired for', pubkey);
          get().clearFollowList(pubkey);
          return null;
        }

        console.log('[FollowCache] Cache hit for', pubkey, ':', cached.followList.length, 'follows, kind:', cached.kind);
        return { followList: cached.followList, kind: cached.kind };
      },

      setFollowList: (pubkey, followList, kind) => {
        const cache = new Map(get().cache);
        cache.set(pubkey, {
          pubkey,
          followList,
          timestamp: Date.now(),
          kind,
        });
        console.log('[FollowCache] Cached follow list for', pubkey, ':', followList.length, 'follows, kind:', kind);
        set({ cache });
      },

      clearFollowList: (pubkey) => {
        const cache = new Map(get().cache);
        cache.delete(pubkey);
        set({ cache });
        console.log('[FollowCache] Cleared cache for', pubkey);
      },

      clearExpiredCache: () => {
        const cache = new Map(get().cache);
        const now = Date.now();
        let cleared = 0;

        for (const [pubkey, entry] of cache.entries()) {
          if (now - entry.timestamp > FOLLOW_LIST_CACHE_TTL) {
            cache.delete(pubkey);
            cleared++;
          }
        }

        if (cleared > 0) {
          console.log('[FollowCache] Cleared', cleared, 'expired entries');
          set({ cache });
        }
      },
    }),
    {
      name: 'follow-cache-storage',
      storage: createJSONStorage(() => localStorage),
      // MapをJSONに変換
      partialize: (state) => ({
        cache: Array.from(state.cache.entries()),
      }),
      // JSONからMapに復元
      merge: (persistedState, currentState) => {
        if (persistedState && typeof persistedState === 'object' && 'cache' in persistedState) {
          const cacheArray = persistedState.cache as Array<[string, FollowListCache]>;
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
