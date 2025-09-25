"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { SearchType } from '../../features/search/types';
import { useSearch } from '../../features/search/hooks/useSearch';
import { SearchBox } from '../../components/search/SearchBox';
import { SearchResults } from '../../components/search/SearchResults';
import { likeTweet, unlikeTweet, retweet, undoRetweet } from '../../features/timeline/services/timeline';

const ALLOWED_TYPES: SearchType[] = ['all', 'users', 'tweets'];

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500 dark:text-gray-400">検索を読み込んでいます...</div>}>
      <ExplorePageInner />
    </Suspense>
  );
}

function ExplorePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const skipSyncRef = useRef(false);

  const {
    query,
    setQuery,
    searchType,
    setSearchType,
    results,
    isLoading,
    error,
    search,
    clearResults,
  } = useSearch();

  const [pendingSync, setPendingSync] = useState<{ q: string; type: SearchType } | null>(null);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const qParam = searchParams.get('q') ?? '';
    const typeParamRaw = searchParams.get('type') ?? 'all';
    const typeParam = ALLOWED_TYPES.includes(typeParamRaw as SearchType)
      ? (typeParamRaw as SearchType)
      : 'all';

    setPendingSync({ q: qParam, type: typeParam });
    setQuery(qParam);
    setSearchType(typeParam);
  }, [searchParams, setQuery, setSearchType]);

  useEffect(() => {
    if (!pendingSync) return;
    if (query === pendingSync.q && searchType === pendingSync.type) {
      if (pendingSync.q) {
        search();
      } else {
        clearResults();
      }
      setPendingSync(null);
    }
  }, [pendingSync, query, searchType, search, clearResults]);

  const replaceUrl = useCallback((nextQuery: string, nextType: SearchType) => {
    const params = new URLSearchParams();
    const trimmed = nextQuery.trim();
    if (trimmed) {
      params.set('q', trimmed);
      if (nextType !== 'all') {
        params.set('type', nextType);
      }
    }
    skipSyncRef.current = true;
    const queryString = params.toString();
    const target = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(target as any, { scroll: false });
  }, [router, pathname]);

  const handleSearchSubmit = useCallback(async () => {
    await search();
    replaceUrl(query, searchType);
  }, [search, replaceUrl, query, searchType]);

  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
    if (query.trim()) {
      replaceUrl(query, type);
    } else {
      replaceUrl('', 'all');
    }
  }, [setSearchType, replaceUrl, query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchType('all');
    clearResults();
    replaceUrl('', 'all');
  }, [setQuery, setSearchType, clearResults, replaceUrl]);

  const handleLike = useCallback(async (tweetId: string) => {
    const tweet = results?.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    try {
      if (tweet.isLiked) {
        await unlikeTweet(tweetId);
      } else {
        await likeTweet(tweetId);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, [results]);

  const handleRetweet = useCallback(async (tweetId: string) => {
    const tweet = results?.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    try {
      if (tweet.isRetweeted) {
        await undoRetweet(tweetId);
      } else {
        await retweet(tweetId);
      }
    } catch (error) {
      console.error('Failed to toggle retweet:', error);
    }
  }, [results]);

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            検索
          </h1>
          
          {/* 検索ボックス */}
          <SearchBox
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            placeholder="検索"
            autoFocus={false}
            onClear={handleClear}
          />
        </div>

        {/* 検索タイプタブ */}
        {query && (
          <div className="flex border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => handleSearchTypeChange('all')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-200 ${
                searchType === 'all'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => handleSearchTypeChange('users')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-200 ${
                searchType === 'users'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              ユーザー
            </button>
            <button
              onClick={() => handleSearchTypeChange('tweets')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-200 ${
                searchType === 'tweets'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              投稿
            </button>
          </div>
        )}
      </header>

      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <p className="font-medium">検索エラー</p>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('NIP-50対応リレー') && (
            <a href="/settings" className="text-sm mt-2 underline block">
              設定ページでNIP-50対応リレーを設定してください
            </a>
          )}
        </div>
      )}

      {/* コンテンツ */}
      <main>
        {query ? (
          // 検索結果
          <SearchResults
            results={results}
            isLoading={isLoading}
            searchType={searchType}
            onLike={handleLike}
            onRetweet={handleRetweet}
          />
        ) : (
          // おすすめユーザー
          <div className="p-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                おすすめユーザー
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                ユーザー検索で探してみましょう
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
