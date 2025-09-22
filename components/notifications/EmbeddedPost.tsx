"use client";

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SafeImage } from '../ui/SafeImage';
import { clsx } from 'clsx';
import { RichContent } from '../timeline/RichContent';

interface EmbeddedPostProps {
  postId: string;
  content: string;
  author?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
    npub?: string;
  };
  createdAt?: Date;
  media?: Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  }>;
  isQuote?: boolean;
  className?: string;
}

export function EmbeddedPost({ 
  postId, 
  content, 
  author, 
  createdAt, 
  media,
  isQuote = false,
  className 
}: EmbeddedPostProps) {
  const timeAgo = createdAt ? formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: ja,
  }) : null;

  return (
    <Link
      href={`/note/${postId}` as any}
      className={clsx(
        'block mt-3 p-3 rounded-xl border transition-all duration-200',
        isQuote 
          ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-900/50'
          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/70',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 著者情報がある場合 */}
      {author && author.npub && (
        <div className="flex items-center gap-2 mb-2">
          {author.avatar ? (
            <SafeImage
              src={author.avatar}
              alt={author.name || 'User'}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">
              {author.name || author.username || 'Unknown'}
            </span>
            {author.username && (
              <span className="text-gray-500 dark:text-gray-400">
                @{author.username}
              </span>
            )}
            {timeAgo && (
              <>
                <span className="text-gray-400 dark:text-gray-500">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {timeAgo}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 本文 */}
      <div className="text-sm">
        <RichContent content={content} />
      </div>

      {/* メディア */}
      {media && media.length > 0 && (
        <div className={clsx(
          'mt-2 grid gap-2',
          media.length === 1 && 'grid-cols-1',
          media.length === 2 && 'grid-cols-2',
          media.length === 3 && 'grid-cols-3',
          media.length >= 4 && 'grid-cols-2'
        )}>
          {media.slice(0, 4).map((item, index) => (
            <div
              key={index}
              className={clsx(
                'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
                media.length === 1 && 'aspect-video',
                media.length > 1 && 'aspect-square'
              )}
            >
              {item.type === 'image' && (
                <SafeImage
                  src={item.url}
                  alt={item.altText || 'Image'}
                  fill
                  className="object-cover"
                />
              )}
              {item.type === 'video' && (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  playsInline
                />
              )}
              {/* 4枚以上の場合の"+N"表示 */}
              {media.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{media.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}