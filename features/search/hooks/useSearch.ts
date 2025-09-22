"use client";

import { useState, useCallback, useEffect } from 'react';
import { searchContent } from '../services/search';
import { SearchParams, SearchResult, SearchType } from '../types';

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
}

/**
 * 検索機能のカスタムフック
 */
export function useSearch(initialQuery: string = ''): UseSearchReturn {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // 検索を実行
  const search = useCallback(async () => {
    if (!query || query.trim() === '') {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params: SearchParams = {
        query: query,
        type: searchType,
        limit: 20,
      };

      const searchResults = await searchContent(params);
      setResults(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索中にエラーが発生しました';
      setError(errorMessage);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType]);

  // 結果をクリア
  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

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
  };
}