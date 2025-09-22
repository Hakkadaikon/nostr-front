"use client";

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SafeImage } from '../ui/SafeImage';
import EmbeddedNote from '../notes/EmbeddedNote';
import { RichContent } from './RichContent';
import Link from 'next/link';
import { Tweet } from '../../features/timeline/types';
import { Heart, MessageCircle, Repeat2, Share, Zap } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

interface TimelineItemProps {
  tweet: Tweet;
  onLike: (tweetId: string) => void;
  onRetweet: (tweetId: string) => void;
  onZap?: (tweetId: string) => void;
  onReply?: (tweet: Tweet) => void;
}

export function TimelineItem({ tweet, onLike, onRetweet, onZap, onReply }: TimelineItemProps) {
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
            <IconButton
              onClick={() => onReply?.(tweet)}
              variant="share"
              size="small"
              count={tweet.repliesCount}
              aria-label="返信"
            >
              <MessageCircle size={18} />
            </IconButton>

            {/* リツイート */}
            <IconButton
              onClick={() => onRetweet(tweet.id)}
              variant="retweet"
              size="small"
              active={tweet.isRetweeted}
              count={tweet.retweetsCount}
              aria-label="リツイート"
            >
              <Repeat2 size={18} />
            </IconButton>

            {/* いいね */}
            <IconButton
              onClick={() => onLike(tweet.id)}
              variant="like"
              size="small"
              active={tweet.isLiked}
              count={tweet.likesCount}
              aria-label="いいね"
            >
              <Heart
                size={18}
                fill={tweet.isLiked ? 'currentColor' : 'none'}
              />
            </IconButton>

            {/* Zap */}
            <IconButton
              onClick={() => onZap?.(tweet.id)}
              variant="zap"
              size="small"
              count={tweet.zapsCount}
              aria-label="Zap"
            >
              <Zap size={18} />
            </IconButton>

            {/* 共有 */}
            <IconButton
              variant="share"
              size="small"
              aria-label="共有"
            >
              <Share size={18} />
            </IconButton>
          </div>
        </div>
      </div>
    </article>
  );
}