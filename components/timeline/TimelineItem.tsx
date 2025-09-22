"use client";

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SafeImage } from '../ui/SafeImage';
import EmbeddedNote from '../notes/EmbeddedNote';
import { RichContent } from './RichContent';
import Link from 'next/link';
import { Tweet } from '../../features/timeline/types';
import { Heart, MessageCircle, Repeat2, Share, Zap } from 'lucide-react';

interface TimelineItemProps {
  tweet: Tweet;
  onLike: (tweetId: string) => void;
  onRetweet: (tweetId: string) => void;
  onZap?: (tweetId: string) => void;
}

export function TimelineItem({ tweet, onLike, onRetweet, onZap }: TimelineItemProps) {
  const timeAgo = formatDistanceToNow(new Date(tweet.createdAt), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <article className="border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all duration-200 group">
      <div className="flex gap-3">
        {/* アバター */}
        <Link href={`/${tweet.author.username}` as any} className="flex-shrink-0">
          {tweet.author.avatar ? (
            <SafeImage
              src={tweet.author.avatar}
              alt={tweet.author.name}
              width={48}
              height={48}
              className="rounded-full hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* ヘッダー */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <Link
                href={`/${tweet.author.username}` as any}
                className="font-bold text-gray-900 dark:text-white hover:underline"
              >
                {tweet.author.name}
              </Link>
              <Link
                href={`/${tweet.author.username}` as any}
                className="text-gray-500 dark:text-gray-400"
              >
                @{tweet.author.username}
              </Link>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <Link
                href={`/status/${tweet.id}` as any}
                className="text-gray-500 dark:text-gray-400 hover:underline"
              >
                {timeAgo}
              </Link>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="mt-2">
            <RichContent content={tweet.content} tags={tweet.tags} suppressNoteIds={tweet.quote ? [tweet.quote.id] : undefined} />
          </div>

          {/* メディア */}
          {tweet.media && tweet.media.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {tweet.media.map((media) => (
                <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {media.type === 'image' && (
                    <SafeImage
                      src={media.url}
                      alt={media.altText || ''}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* アクションバー */}
          <div className="mt-3 flex items-center justify-between max-w-md">
            {/* 返信 */}
            <button
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors group"
              aria-label="返信"
            >
              <div className="p-2 rounded-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950/20 transition-all duration-200 hover:scale-110">
                <MessageCircle size={18} />
              </div>
              {tweet.repliesCount > 0 && (
                <span className="text-sm">{tweet.repliesCount}</span>
              )}
            </button>

            {/* リツイート */}
            <button
              onClick={() => onRetweet(tweet.id)}
              className={`flex items-center gap-2 transition-colors group ${
                tweet.isRetweeted
                  ? 'text-green-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
              }`}
              aria-label="リツイート"
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-950/20 transition-all duration-200 hover:scale-110">
                <Repeat2 size={18} />
              </div>
              {tweet.retweetsCount > 0 && (
                <span className="text-sm">{tweet.retweetsCount}</span>
              )}
            </button>

            {/* いいね */}
            <button
              onClick={() => onLike(tweet.id)}
              className={`flex items-center gap-2 transition-colors group ${
                tweet.isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
              aria-label="いいね"
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-950/20 transition-all duration-200 hover:scale-110">
                <Heart
                  size={18}
                  fill={tweet.isLiked ? 'currentColor' : 'none'}
                />
              </div>
              {tweet.likesCount > 0 && (
                <span className="text-sm">{tweet.likesCount}</span>
              )}
            </button>

            {/* Zap */}
            <button
              onClick={() => onZap?.(tweet.id)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors group"
              aria-label="Zap"
            >
              <div className="p-2 rounded-full group-hover:bg-yellow-50 dark:group-hover:bg-yellow-950/20 transition-all duration-200 hover:scale-110">
                <Zap size={18} />
              </div>
              {tweet.zapsCount > 0 && (
                <span className="text-sm">{tweet.zapsCount}</span>
              )}
            </button>

            {/* 共有 */}
            <button
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors group"
              aria-label="共有"
            >
              <div className="p-2 rounded-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950/20 transition-all duration-200 hover:scale-110">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}