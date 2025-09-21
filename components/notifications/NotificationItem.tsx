"use client";

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, UserPlus, AtSign, Zap } from 'lucide-react';
import { Notification } from '../../types/notification';
import { useNotificationStore } from '../../stores/notification.store';
import { clsx } from 'clsx';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useNotificationStore(s => s.markAsRead);
  const timeAgo = formatDistanceToNow(notification.createdAt, {
    addSuffix: true,
    locale: ja,
  });

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'repost':
        return <Repeat2 className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-blue-500" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-yellow-500" fill="currentColor" />;
    }
  };

  const getMessage = () => {
    switch (notification.type) {
      case 'like':
        return 'があなたの投稿にいいねしました';
      case 'reply':
        return 'があなたの投稿に返信しました';
      case 'repost':
        return 'があなたの投稿をリポストしました';
      case 'follow':
        return 'があなたをフォローしました';
      case 'mention':
        return 'があなたをメンションしました';
      case 'zap':
        return `があなたに${notification.amount} satsを送りました`;
    }
  };

  return (
    <article
      onClick={handleClick}
      className={clsx(
        'border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all duration-200 cursor-pointer',
        !notification.isRead && 'bg-purple-50/30 dark:bg-purple-900/10'
      )}
    >
      <div className="flex gap-3">
        {/* アイコン */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          {/* ユーザー情報とアクション */}
          <div className="flex items-start gap-1 flex-wrap">
            <Link
              href={`/${notification.user.username}` as any}
              className="font-bold text-gray-900 dark:text-white hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.user.name}
            </Link>
            <span className="text-gray-700 dark:text-gray-300">
              {getMessage()}
            </span>
          </div>

          {/* タイムスタンプ */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {timeAgo}
          </div>

          {/* 返信内容 or メンション内容 */}
          {notification.content && (
            <div className="mt-2 text-gray-900 dark:text-white">
              {notification.content}
            </div>
          )}

          {/* 元の投稿内容 */}
          {notification.postContent && (
            <Link
              href={`/status/${notification.postId}` as any}
              className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 block hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {notification.postContent}
              </div>
            </Link>
          )}

          {/* 未読インジケーター */}
          {!notification.isRead && (
            <div className="absolute top-4 right-4 w-2 h-2 bg-purple-600 rounded-full" />
          )}
        </div>
      </div>
    </article>
  );
}