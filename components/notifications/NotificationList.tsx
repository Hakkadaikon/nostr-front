"use client";

import { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-6 opacity-50">🔔</div>
        <p className="text-lg font-medium mb-2">通知はありません</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          新しいフォロー、いいね、返信があるとここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}