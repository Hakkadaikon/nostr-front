"use client";

import { Switch } from '../ui/Switch';
import { useNotificationSettingsStore } from '../../stores/notification-settings.store';
import { NotificationSettings as NotificationSettingsType } from '../../types/notification-settings';

interface NotificationItem {
  key: keyof NotificationSettingsType;
  label: string;
  description: string;
}

const notificationItems: NotificationItem[] = [
  {
    key: 'follow',
    label: 'フォロー',
    description: '誰かがあなたをフォローしたときに通知を受け取る',
  },
  {
    key: 'mention',
    label: 'メンション',
    description: '誰かがあなたをメンションしたときに通知を受け取る',
  },
  {
    key: 'repost',
    label: 'リポスト',
    description: 'あなたの投稿がリポストされたときに通知を受け取る',
  },
  {
    key: 'zap',
    label: 'Zap',
    description: '誰かがあなたにZapを送ったときに通知を受け取る',
  },
  {
    key: 'like',
    label: 'いいね',
    description: 'あなたの投稿にいいねされたときに通知を受け取る',
  },
  {
    key: 'reply',
    label: '返信',
    description: 'あなたの投稿に返信があったときに通知を受け取る',
  },
];

export function NotificationSettings() {
  const { settings, updateSetting } = useNotificationSettingsStore();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notificationItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900"
          >
            <div className="space-y-0.5">
              <label
                htmlFor={`notification-${item.key}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {item.label}
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </div>
            <Switch
              id={`notification-${item.key}`}
              checked={settings[item.key]}
              onCheckedChange={(checked: boolean) => updateSetting(item.key, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}