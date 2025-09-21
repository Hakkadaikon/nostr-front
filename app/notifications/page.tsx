"use client";

import { useNotificationStore } from '../../stores/notification.store';
import { NotificationList } from '../../components/notifications/NotificationList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();

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
        <TabsList className="w-full border-b border-gray-200 dark:border-gray-800">
          <TabsTrigger value="all" className="flex-1">
            すべて
          </TabsTrigger>
          <TabsTrigger value="mentions" className="flex-1">
            メンション
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="m-0">
          <NotificationList notifications={notifications} />
        </TabsContent>
        
        <TabsContent value="mentions" className="m-0">
          <NotificationList 
            notifications={notifications.filter(n => 
              n.type === 'mention' || n.type === 'reply'
            )} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}