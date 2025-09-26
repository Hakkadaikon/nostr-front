import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchType } from '../features/search/types';

interface SearchHistoryItem {
  id: string;
  query: string;
  type: SearchType;
  timestamp: Date;
  resultCount: number;
}

interface SearchStore {
  // 検索履歴
  history: SearchHistoryItem[];

  // 検索結果キャッシュ
  cache: Map<string, {
    results: any;
    timestamp: Date;
    ttl: number; // ms
  }>;

  // アクション
  addToHistory: (query: string, type: SearchType, resultCount: number) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getRecentSearches: (limit?: number) => SearchHistoryItem[];

  // キャッシュ関連
  getCachedResult: (query: string, type: SearchType) => any | null;
  setCachedResult: (query: string, type: SearchType, results: any, ttl?: number) => void;
  clearCache: () => void;

  // 検索候補
  getSuggestions: (input: string) => string[];
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      history: [],
      cache: new Map(),

      addToHistory: (query: string, type: SearchType, resultCount: number) => {
        if (!query.trim()) return;

        set((state) => {
          // 既存の同じクエリを削除
          const filteredHistory = state.history.filter(
            item => !(item.query === query && item.type === type)
          );

          // 新しいアイテムを先頭に追加
          const newItem: SearchHistoryItem = {
            id: Date.now().toString(),
            query: query.trim(),
            type,
            timestamp: new Date(),
            resultCount,
          };

          // 最大50件に制限
          const newHistory = [newItem, ...filteredHistory].slice(0, 50);

          return { history: newHistory };
        });
      },

      removeFromHistory: (id: string) => {
        set((state) => ({
          history: state.history.filter(item => item.id !== id)
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getRecentSearches: (limit = 10) => {
        return get().history
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      },

      getCachedResult: (query: string, type: SearchType) => {
        const cacheKey = `${query}_${type}`;
        const cached = get().cache.get(cacheKey);

        if (!cached) return null;

        // TTLチェック
        const now = new Date().getTime();
        const cacheTime = new Date(cached.timestamp).getTime();

        if (now - cacheTime > cached.ttl) {
          // 期限切れのキャッシュを削除
          set((state) => {
            const newCache = new Map(state.cache);
            newCache.delete(cacheKey);
            return { cache: newCache };
          });
          return null;
        }

        return cached.results;
      },

      setCachedResult: (query: string, type: SearchType, results: any, ttl = 5 * 60 * 1000) => {
        if (!query.trim()) return;

        const cacheKey = `${query}_${type}`;
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(cacheKey, {
            results,
            timestamp: new Date(),
            ttl,
          });

          // キャッシュサイズを制限（最大100件）
          if (newCache.size > 100) {
            const entries = Array.from(newCache.entries());
            const sortedEntries = entries.sort((a, b) =>
              new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime()
            );
            const newCacheMap = new Map(sortedEntries.slice(0, 100));
            return { cache: newCacheMap };
          }

          return { cache: newCache };
        });
      },

      clearCache: () => {
        set({ cache: new Map() });
      },

      getSuggestions: (input: string) => {
        if (!input.trim()) return [];

        const history = get().history;
        const inputLower = input.toLowerCase();

        // 履歴から類似のクエリを抽出
        const suggestions = history
          .filter(item => item.query.toLowerCase().includes(inputLower))
          .map(item => item.query)
          .filter((query, index, arr) => arr.indexOf(query) === index) // 重複除去
          .slice(0, 5);

        return suggestions;
      },
    }),
    {
      name: 'search-store',
      // cacheはMapなのでシリアライゼーション対象から除外
      partialize: (state) => ({
        history: state.history
      }),
      // デシリアライゼーション時にcacheを初期化
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.cache = new Map();
        }
      },
    }
  )
);