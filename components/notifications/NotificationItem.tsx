"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, UserPlus, AtSign, Zap } from 'lucide-react';
import { Notification } from '../../types/notification';
import { useNotificationStore } from '../../stores/notification.store';
import { clsx } from 'clsx';
import { ReplyComposer } from '../compose/ReplyComposer';
import { useFollow } from '../../features/follow/hooks/useFollow';
import { useAuthStore } from '../../stores/auth.store';
import { useReaction } from '../../features/reactions/hooks/useReaction';
import { SafeImage } from '../ui/SafeImage';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const [showReply, setShowReply] = useState(false);
  const markAsRead = useNotificationStore(s => s.markAsRead);
  const { publicKey: currentUserPubkey } = useAuthStore();
  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(notification.user.npub);
  
  // いいね機能のフック
  const { isLiked, isLoading: isLikeLoading, toggleLike } = useReaction({
    eventId: notification.postId || '',
    authorPubkey: notification.user.pubkey
  });
  
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
        return <Heart className="w-4 h-4 text-red-500" fill="currentColor" />;
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'repost':
        return <Repeat2 className="w-4 h-4 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-500" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" />;
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
        {/* アイコンとアバター */}
        <div className="flex-shrink-0 relative">
          {/* ユーザーアバター */}
          <Link
            href={`/profile/${notification.user.npub}` as any}
            onClick={(e) => e.stopPropagation()}
          >
            {notification.user.avatar ? (
              <SafeImage
                src={notification.user.avatar}
                alt={notification.user.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
          </Link>
          {/* 通知タイプアイコン */}
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* ユーザー情報とアクション */}
          <div className="flex items-start gap-1 flex-wrap">
            <Link
              href={`/profile/${notification.user.npub}` as any}
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

          {/* アクションボタン */}
          <div className="mt-3 flex items-center gap-3">
            {/* フォローボタン - フォロー通知の場合のみ表示（自分自身は除く） */}
            {notification.type === 'follow' && notification.user.pubkey !== currentUserPubkey && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await toggleFollow();
                  } catch (error) {
                    console.error('Failed to toggle follow:', error);
                  }
                }}
                disabled={isFollowLoading}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  isFollowing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-purple-600 text-white hover:bg-purple-700',
                  isFollowLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isFollowLoading ? (
                  '...'
                ) : isFollowing ? (
                  'フォロー中'
                ) : (
                  'フォローする'
                )}
              </button>
            )}
            
            {/* いいねボタン - いいね可能な通知タイプの場合のみ表示 */}
            {(notification.type === 'reply' || notification.type === 'mention' || notification.type === 'like') && notification.postId && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await toggleLike();
                }}
                disabled={isLikeLoading}
                className={clsx(
                  'text-sm transition-colors flex items-center gap-1',
                  isLiked
                    ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
                    : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400',
                  isLikeLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Heart size={16} className={clsx(isLiked && 'fill-current')} />
                いいね
              </button>
            )}
            
            {/* 返信ボタン - 返信可能な通知タイプの場合のみ表示 */}
            {(notification.type === 'reply' || notification.type === 'mention' || notification.type === 'like' || notification.type === 'repost') && notification.postId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReply(!showReply);
                }}
                className="text-sm text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <MessageCircle size={16} />
                返信
              </button>
            )}
          </div>
        </div>
        
        {/* 未読インジケーター */}
        {!notification.isRead && (
          <div className="absolute top-4 right-4 w-2 h-2 bg-purple-600 rounded-full" />
        )}
      </div>

      {/* 返信コンポーザー */}
      {showReply && notification.postId && (
        <ReplyComposer
          replyTo={notification.postId}
          replyToUser={notification.user}
          onClose={() => setShowReply(false)}
          onSuccess={() => setShowReply(false)}
        />
      )}
    </article>
  );
}