"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotificationStore } from '../../stores/notification.store';
import { NotificationList } from '../../components/notifications/NotificationList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';
import { useTranslation } from 'react-i18next';

type TabType = 'all' | 'mentions' | 'replies' | 'reposts' | 'likes' | 'zaps' | 'follows';
const VALID_TABS: TabType[] = ['all', 'mentions', 'replies', 'reposts', 'likes', 'zaps', 'follows'];

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsPageSkeleton />}>
      <NotificationsPageInner />
    </Suspense>
  );
}

function NotificationsPageSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('page.notifications.title')}</h1>
      </header>
    </div>
  );
}

function NotificationsPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getFilteredNotifications, unreadCount } = useNotificationStore();
  const [isMounted, setIsMounted] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);

  const allNotifications = getFilteredNotifications();
  const filteredNotifications = allNotifications.slice(0, displayLimit);
  const hasMore = allNotifications.length > displayLimit;

  // URLからタブタイプを取得（デフォルトは'all'）
  const tabParam = searchParams.get('tab') ?? 'all';
  const activeTab = VALID_TABS.includes(tabParam as TabType) ? tabParam as TabType : 'all';

  // さらに表示ボタンのハンドラ
  const handleLoadMore = useCallback(() => {
    setDisplayLimit(prev => prev + 20);
  }, []);

  // タブ切り替え時にdisplayLimitをリセット
  useEffect(() => {
    setDisplayLimit(20);
  }, [activeTab]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // リアルタイム通知を有効化
  useNotifications();

  // タブ切り替え時の処理
  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/notifications${newUrl}` as any);
  }, [router, searchParams]);

  if (!isMounted) {
    return <NotificationsPageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('page.notifications.title')}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="w-full min-w-fit border-b border-gray-200 dark:border-gray-800 flex">
            <TabsTrigger value="all" className="flex-shrink-0 px-3 sm:px-4">
              {t('page.notifications.tabs.all')}
            </TabsTrigger>
            <TabsTrigger value="mentions" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">{t('page.notifications.tabs.mentions')}</span>
              <span className="sm:hidden">@</span>
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex-shrink-0 px-3 sm:px-4">
              {t('page.notifications.tabs.replies')}
            </TabsTrigger>
            <TabsTrigger value="reposts" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">{t('page.notifications.tabs.reposts')}</span>
              <span className="sm:hidden">RP</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">{t('page.notifications.tabs.likes')}</span>
              <span className="sm:hidden">♥</span>
            </TabsTrigger>
            <TabsTrigger value="zaps" className="flex-shrink-0 px-3 sm:px-4">
              {t('page.notifications.tabs.zaps')}
            </TabsTrigger>
            <TabsTrigger value="follows" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">{t('page.notifications.tabs.follows')}</span>
              <span className="sm:hidden">+</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="m-0">
          <NotificationList notifications={filteredNotifications} />
          {hasMore && (
            <div className="px-4 py-6 text-center border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
              >
                {t('page.notifications.loadMore', { count: allNotifications.length - displayLimit })}
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mentions" className="m-0">
          <NotificationList
            notifications={filteredNotifications.filter(n =>
              n.type === 'mention'
            )}
          />
        </TabsContent>

        <TabsContent value="replies" className="m-0">
          <NotificationList
            notifications={filteredNotifications.filter(n =>
              n.type === 'reply'
            )}
          />
        </TabsContent>

        <TabsContent value="reposts" className="m-0">
          <NotificationList
            notifications={filteredNotifications.filter(n =>
              n.type === 'repost'
            )}
          />
        </TabsContent>

        <TabsContent value="likes" className="m-0">
          <NotificationList
            notifications={filteredNotifications.filter(n =>
              n.type === 'like'
            )}
          />
        </TabsContent>

        <TabsContent value="zaps" className="m-0">
          <NotificationList
            notifications={filteredNotifications.filter(n =>
              n.type === 'zap'
            )}
          />
        </TabsContent>

        <TabsContent value="follows" className="m-0">
          <NotificationList
            notifications={filteredNotifications.filter(n =>
              n.type === 'follow'
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}