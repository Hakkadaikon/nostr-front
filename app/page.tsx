"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTimeline } from '../features/timeline/hooks/useTimeline';
import { TimelineList } from '../components/timeline/TimelineList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useAuthStore } from '../stores/auth.store';
import { useTranslation } from 'react-i18next';

type HomeTab = 'global' | 'following';

export default function HomePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as HomeTab) || 'global';
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);

  const TAB_ITEMS = [
    {
      id: 'global' as const,
      label: t('common.global'),
      description: t('timeline.checkLatestPosts'),
    },
    {
      id: 'following' as const,
      label: t('common.following'),
      description: t('timeline.followingUsersPosts'),
    },
  ] as const;

  const { npub, publicKey } = useAuthStore((state) => ({
    npub: state.npub,
    publicKey: state.publicKey,
  }));
  const isAuthenticated = Boolean(npub || publicKey);

  const globalTimeline = useTimeline({
    type: 'home',
    limit: 20,
  });

  const followingTimeline = useTimeline({
    type: 'following',
    limit: 20,
  });

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
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {t('page.home.title')}
            </h1>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800">
            <nav className="grid grid-cols-2 gap-1 sm:flex sm:overflow-x-auto" role="tablist" aria-label={t('page.home.tabsAriaLabel')}>
              {TAB_ITEMS.map(({ id, label }) => {
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
                    className={`w-full sm:flex-1 px-4 py-3 text-sm sm:text-base text-center font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 sm:border-b-2'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                    }`}
                    role="tab"
                    aria-selected={isActive}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full">
          {shouldBlockFollowingTimeline ? (
            <div className="px-4 sm:px-6 lg:px-8 py-12 text-center">
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                {t('page.home.loginRequiredForFollowing')}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('page.home.followingPostsWillAppear')}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-full overflow-hidden">
              <TimelineList
                tweets={tweets}
                isLoading={isLoading}
                error={error}
                onLike={toggleLike}
                onRetweet={toggleRetweet}
                hideReactions={activeTab === 'following'}
              />
              <div ref={sentinelRef} className="h-10" />
              {!hasMore && tweets.length > 0 && (
                <div className="px-4 pb-6 text-center text-sm text-gray-400 dark:text-gray-600">
                  {t('timeline.allPostsShown')}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
