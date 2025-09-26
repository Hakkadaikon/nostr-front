"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { searchContent } from '../services/search';
import { SearchParams, SearchResult, SearchType } from '../types';
import { useSearchStore } from '../../../stores/search.store';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  search: () => Promise<void>;
  clearResults: () => void;
  debouncedSearch: () => void;
}

/**
 * 検索機能のカスタムフック
 */
export function useSearch(initialQuery: string = '', initialType: SearchType = 'all'): UseSearchReturn {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getCachedResult, setCachedResult, addToHistory } = useSearchStore();


  // 検索を実行（キャッシュ機能付き）
  const search = useCallback(async () => {
    if (!query || query.trim() === '') {
      setResults(null);
      return;
    }

    // キャッシュから結果を取得
    const cachedResult = getCachedResult(query.trim(), searchType);
    if (cachedResult) {
      console.log('[Search] Using cached result for:', query.trim(), searchType);
      setResults(cachedResult);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params: SearchParams = {
        query: query.trim(),
        type: searchType,
        limit: 20,
      };

      const searchResults = await searchContent(params);
      setResults(searchResults);

      // 結果をキャッシュに保存
      setCachedResult(query.trim(), searchType, searchResults);

      // 履歴に追加
      const totalResults = (searchResults.users?.length || 0) + (searchResults.tweets?.length || 0);
      addToHistory(query.trim(), searchType, totalResults);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索中にエラーが発生しました';
      setError(errorMessage);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType, getCachedResult, setCachedResult, addToHistory]);

  // 結果をクリア
  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
    // デバウンスタイマーもクリア
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // デバウンス検索（500ms後に実行）
  const debouncedSearch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        search();
      }
    }, 500);
  }, [query, search]);

  // 検索タイプが変更されたら再検索（結果がある場合のみ）
  useEffect(() => {
    if (query && results) {
      search();
    }
  }, [searchType]);

  // クエリが空になったら結果をクリア
  useEffect(() => {
    if (!query) {
      clearResults();
    }
  }, [query, clearResults]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    searchType,
    setSearchType,
    results,
    isLoading,
    error,
    search,
    clearResults,
    debouncedSearch,
  };
}