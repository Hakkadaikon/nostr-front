"use client";

import { useNotificationStore } from '../../stores/notification.store';
import { NotificationList } from '../../components/notifications/NotificationList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function NotificationsPage() {
  const { getFilteredNotifications, unreadCount, markAllAsRead } = useNotificationStore();
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            通知
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              すべて既読にする
            </button>
          )}
        </div>
      </header>

      {/* タブ */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full border-b border-gray-200 dark:border-gray-800 overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="min-w-fit px-4">
            すべて
          </TabsTrigger>
          <TabsTrigger value="mentions" className="min-w-fit px-4">
            メンション
          </TabsTrigger>
          <TabsTrigger value="replies" className="min-w-fit px-4">
            返信
          </TabsTrigger>
          <TabsTrigger value="reposts" className="min-w-fit px-4">
            リポスト
          </TabsTrigger>
          <TabsTrigger value="likes" className="min-w-fit px-4">
            いいね
          </TabsTrigger>
          <TabsTrigger value="zaps" className="min-w-fit px-4">
            Zap
          </TabsTrigger>
          <TabsTrigger value="follows" className="min-w-fit px-4">
            フォロー
          </TabsTrigger>
        </TabsList>
        
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