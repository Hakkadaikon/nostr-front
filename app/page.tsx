"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTimeline } from '../features/timeline/hooks/useTimeline';
import { TimelineList } from '../components/timeline/TimelineList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useAuthStore } from '../stores/auth.store';

const TAB_ITEMS = [
  {
    id: 'global' as const,
    label: 'グローバル',
    description: '最新の投稿をチェック',
  },
  {
    id: 'following' as const,
    label: 'フォロー中',
    description: 'フォローしているユーザーの投稿',
  },
] as const;

type HomeTab = (typeof TAB_ITEMS)[number]['id'];

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as HomeTab) || 'global';
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);

  const { npub, publicKey } = useAuthStore((state) => ({
    npub: state.npub,
    publicKey: state.publicKey,
  }));
  const isAuthenticated = Boolean(npub || publicKey);

  // タブごとに独立したタイムラインを保持（ちらつき防止）
  const globalTimeline = useTimeline({
    type: 'home',
    limit: 20,
  });

  const followingTimeline = useTimeline({
    type: 'following',
    limit: 20,
  });

  // アクティブなタブに応じてタイムラインを切り替え
  const {
    tweets,
    isLoading,
    error,
    hasMore,
    loadMore,
    toggleLike,
    toggleRetweet,
    reset,
  } = activeTab === 'global' ? globalTimeline : followingTimeline;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const shouldBlockFollowingTimeline = activeTab === 'following' && !isAuthenticated;

  const handleIntersect = useCallback(() => {
    if (!hasMore || isLoading || shouldBlockFollowingTimeline) {
      return;
    }
    loadMore();
  }, [hasMore, isLoading, shouldBlockFollowingTimeline, loadMore]);

  useInfiniteScroll({
    target: sentinelRef,
    onIntersect: handleIntersect,
    enabled: hasMore && !isLoading && !shouldBlockFollowingTimeline,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (shouldBlockFollowingTimeline) {
      reset();
    }
  }, [shouldBlockFollowingTimeline, reset]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 overflow-hidden">
        <header className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">ホーム</h1>
          </div>
          

          <nav className="flex w-full flex-wrap gap-2" role="tablist" aria-label="ホームタブ">
            {TAB_ITEMS.map(({ id, label, description }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    const sp = new URLSearchParams(Array.from(searchParams.entries()));
                    sp.set('tab', id);
                    router.replace(`/?${sp.toString()}`);
                  }}
                  className={`flex-1 min-w-[140px] rounded-full border px-4 py-2 text-sm font-medium transition-all sm:text-base ${
                    isActive
                      ? 'border-transparent bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 dark:border-gray-800 dark:text-gray-300 dark:hover:border-purple-500 dark:hover:text-purple-300'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span className="block text-sm sm:text-base">{label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-gray-400 dark:text-gray-500">
                    {description}
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <main className="min-w-0 flex-1 space-y-6 overflow-hidden">

            <section className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
              {shouldBlockFollowingTimeline ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                    フォロー中のタイムラインを見るにはログインが必要です。
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    ログイン後、最新のフォロー投稿がここに表示されます。
                  </p>
                </div>
              ) : (
                <>
                  <TimelineList
                    tweets={tweets}
                    isLoading={isLoading}
                    error={error}
                    onLike={toggleLike}
                    onRetweet={toggleRetweet}
                  />
                  <div ref={sentinelRef} className="h-10" />
                  {!hasMore && tweets.length > 0 && (
                    <div className="px-4 pb-6 text-center text-sm text-gray-400 dark:text-gray-600">
                      すべてのポストを表示しました
                    </div>
                  )}
                </>
              )}
            </section>
          </main>

        </div>
      </div>
    </div>
  );
}
