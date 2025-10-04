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
    label: 'リアクション',
    description: 'あなたの投稿にリアクションされたときに通知を受け取る',
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
      {notificationItems.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between p-5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="space-y-1">
            <label
              htmlFor={`notification-${item.key}`}
              className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              {item.label}
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
  );
}