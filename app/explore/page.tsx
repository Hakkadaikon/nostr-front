"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearch } from '../../features/search/hooks/useSearch';
import { SearchBox } from '../../components/search/SearchBox';
import { SearchResults } from '../../components/search/SearchResults';
import { fetchTrends } from '../../features/search/services/search';
import { Trend } from '../../features/search/types';
import { likeTweet, unlikeTweet, retweet, undoRetweet } from '../../features/timeline/services/timeline';
import { TrendingUp } from 'lucide-react';

export default function ExplorePage() {
  const {
    query,
    setQuery,
    searchType,
    setSearchType,
    results,
    isLoading,
    error,
  } = useSearch();
  
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // トレンドを取得
  useEffect(() => {
    async function loadTrends() {
      try {
        const trendData = await fetchTrends();
        setTrends(trendData);
      } catch (err) {
        console.error('Failed to load trends:', err);
      } finally {
        setLoadingTrends(false);
      }
    }
    loadTrends();
  }, []);

  // いいねの処理
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

  // リツイートの処理
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
            探索
          </h1>
          
          {/* 検索ボックス */}
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="検索"
            autoFocus
          />
        </div>

        {/* 検索タイプタブ */}
        {query && (
          <div className="flex border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setSearchType('all')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-200 ${
                searchType === 'all'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setSearchType('users')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-200 ${
                searchType === 'users'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              ユーザー
            </button>
            <button
              onClick={() => setSearchType('tweets')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-200 ${
                searchType === 'tweets'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              ツイート
            </button>
          </div>
        )}
      </header>

      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
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
          // トレンド表示
          <div className="p-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-purple-600" />
                トレンド
              </h2>
              {loadingTrends ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {trends.map((trend, index) => (
                    <button
                      key={trend.hashtag}
                      onClick={() => setQuery(trend.hashtag)}
                      className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {index + 1}. {trend.category && `${trend.category} · `}トレンド
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {trend.hashtag}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {trend.count.toLocaleString()} 件のポスト
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* おすすめユーザー */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
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