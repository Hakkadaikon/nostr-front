"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { SearchType } from '../../features/search/types';
import { useSearch } from '../../features/search/hooks/useSearch';
import { SearchBox } from '../../components/search/SearchBox';
import { SearchResults } from '../../components/search/SearchResults';
import { likeTweet, unlikeTweet, retweet, undoRetweet } from '../../features/timeline/services/timeline';
import { useAuthStore } from '../../stores/auth.store';
import { useTranslation } from 'react-i18next';

const ALLOWED_TYPES: SearchType[] = ['users', 'tweets'];

export default function ExplorePage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('page.explore.loading')}</div>}>
      <ExplorePageInner />
    </Suspense>
  );
}

function ExplorePageInner() {
  const { t } = useTranslation();
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
  } = useSearch('', 'users');

  const [pendingSync, setPendingSync] = useState<{ q: string; type: SearchType } | null>(null);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const qParam = searchParams.get('q') ?? '';
    const typeParamRaw = searchParams.get('type') ?? 'users';
    const typeParam = ALLOWED_TYPES.includes(typeParamRaw as SearchType)
      ? (typeParamRaw as SearchType)
      : 'users';

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
    }
    if (nextType !== 'users') {
      params.set('type', nextType);
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
      replaceUrl('', type);
    }
  }, [setSearchType, replaceUrl, query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchType('users');
    clearResults();
    replaceUrl('', 'users');
  }, [setQuery, setSearchType, clearResults, replaceUrl]);

  const { publicKey } = useAuthStore();

  const handleLike = useCallback(async (tweetId: string) => {
    const tweet = results?.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 認証チェック
    if (!publicKey) {
      return;
    }

    try {
      if (tweet.isLiked) {
        await unlikeTweet(tweetId);
      } else {
        await likeTweet(tweetId, tweet.author.id);
      }
    } catch (error) {
    }
  }, [results, publicKey]);

  const handleRetweet = useCallback(async (tweetId: string) => {
    const tweet = results?.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 認証チェック
    if (!publicKey) {
      return;
    }

    try {
      if (tweet.isRetweeted) {
        await undoRetweet(tweetId);
      } else {
        await retweet(tweetId, tweet.author.id);
      }
    } catch (error) {
    }
  }, [results, publicKey]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {t('page.explore.title')}
            </h1>

            <SearchBox
              value={query}
              onChange={setQuery}
              onSubmit={handleSearchSubmit}
              placeholder={t('page.explore.placeholder')}
              autoFocus={false}
              onClear={handleClear}
            />
          </div>

          {query && (
            <div className="border-t border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-2 gap-1 sm:flex sm:overflow-x-auto">
                <button
                  onClick={() => handleSearchTypeChange('users')}
                  className={`w-full sm:flex-1 px-4 py-3 text-sm sm:text-base text-center font-medium transition-all duration-200 whitespace-nowrap ${
                    searchType === 'users'
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 sm:border-b-2'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }`}
                >
                  {t('page.explore.tabs.users')}
                </button>
                <button
                  onClick={() => handleSearchTypeChange('tweets')}
                  className={`w-full sm:flex-1 px-4 py-3 text-sm sm:text-base text-center font-medium transition-all duration-200 whitespace-nowrap ${
                    searchType === 'tweets'
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 sm:border-b-2'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }`}
                >
                  {t('page.explore.tabs.posts')}
                </button>
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <p className="font-medium text-sm sm:text-base">{t('page.explore.error')}</p>
            <p className="text-xs sm:text-sm mt-1">{error}</p>
            {error.includes('NIP-50対応リレー') && (
              <a href="/settings" className="text-xs sm:text-sm mt-2 underline block">
                {t('page.explore.configureRelays')}
              </a>
            )}
          </div>
        )}

        <main className="flex-1 w-full">
          {query ? (
            <div className="w-full max-w-full overflow-hidden">
              <SearchResults
                results={results}
                isLoading={isLoading}
                searchType={searchType}
                onLike={handleLike}
                onRetweet={handleRetweet}
              />
            </div>
          ) : (
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  {t('page.explore.recommendedUsers')}
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {t('page.explore.tryUserSearch')}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
