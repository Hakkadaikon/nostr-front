"use client";

import { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import { useTranslation } from 'react-i18next';

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const { t } = useTranslation();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-6 opacity-50">🔔</div>
        <p className="text-lg font-medium mb-2">{t('notifications.empty')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t('notifications.emptyDescription')}
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