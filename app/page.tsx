"use client";

import { useTimeline } from '../features/timeline/hooks/useTimeline';
import { TimelineList } from '../components/timeline/TimelineList';
import { TweetComposer } from '../components/tweets/TweetComposer';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useCallback, useRef, useState } from 'react';
import { Tweet } from '../features/timeline/types';
import { useAuthStore } from '../stores/auth.store';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'recommended' | 'following'>('recommended');
  
  const { tweets, isLoading, error, hasMore, loadMore, toggleLike, toggleRetweet, addTweet } = useTimeline({
    type: activeTab === 'recommended' ? 'home' : 'following',
    limit: 10, // 初期表示件数を20件から10件に削減
  });

  // 無限スクロール用のref
  const observerTarget = useRef<HTMLDivElement>(null);

  // 無限スクロールのコールバック
  const handleIntersect = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  // 無限スクロールフックを使用
  useInfiniteScroll({
    target: observerTarget,
    onIntersect: handleIntersect,
    enabled: hasMore && !isLoading,
  });

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ホーム
          </h1>
        </div>
        <div className="flex">
          <button 
            onClick={() => setActiveTab('recommended')}
            className={`relative flex-1 px-4 py-4 text-center font-medium transition-all duration-200 ${
              activeTab === 'recommended'
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20'
            }`}
          >
            おすすめ
            {activeTab === 'recommended' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`relative flex-1 px-4 py-4 text-center font-medium transition-all duration-200 ${
              activeTab === 'following'
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20'
            }`}
          >
            フォロー中
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            )}
          </button>
        </div>
      </header>

      {/* 投稿フォーム（ログイン時のみ） */}
      {/* TweetComposerは署名が必要なため未ログイン時は非表示 */}
      {require('../stores/auth.store').useAuthStore.getState().npub ? (
        <TweetComposer onTweetCreated={addTweet} />
      ) : null}

      {/* タイムライン */}
      <main>
        <TimelineList
          tweets={tweets}
          isLoading={isLoading}
          error={error}
          onLike={toggleLike}
          onRetweet={toggleRetweet}
        />
        
        {/* 無限スクロールのターゲット */}
        <div ref={observerTarget} className="h-1" />
      </main>
    </div>
  );
}