"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotificationStore } from '../../stores/notification.store';
import { NotificationList } from '../../components/notifications/NotificationList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';

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
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">通知</h1>
      </header>
    </div>
  );
}

function NotificationsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getFilteredNotifications } = useNotificationStore();
  const [isMounted, setIsMounted] = useState(false);
  const filteredNotifications = getFilteredNotifications();
  
  // URLからタブタイプを取得（デフォルトは'all'）
  const tabParam = searchParams.get('tab') ?? 'all';
  const activeTab = VALID_TABS.includes(tabParam as TabType) ? tabParam as TabType : 'all';
  
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
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            通知
          </h1>
        </div>
      </header>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="w-full min-w-fit border-b border-gray-200 dark:border-gray-800 flex">
            <TabsTrigger value="all" className="flex-shrink-0 px-3 sm:px-4">
              すべて
            </TabsTrigger>
            <TabsTrigger value="mentions" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">メンション</span>
              <span className="sm:hidden">@</span>
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex-shrink-0 px-3 sm:px-4">
              返信
            </TabsTrigger>
            <TabsTrigger value="reposts" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">リポスト</span>
              <span className="sm:hidden">RP</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">いいね</span>
              <span className="sm:hidden">♥</span>
            </TabsTrigger>
            <TabsTrigger value="zaps" className="flex-shrink-0 px-3 sm:px-4">
              Zap
            </TabsTrigger>
            <TabsTrigger value="follows" className="flex-shrink-0 px-3 sm:px-4">
              <span className="hidden sm:inline">フォロー</span>
              <span className="sm:hidden">+</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="m-0">
          <NotificationList notifications={filteredNotifications} />
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