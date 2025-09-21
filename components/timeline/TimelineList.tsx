"use client";

import { Tweet } from '../../features/timeline/types';
import { TimelineItem } from './TimelineItem';
import { Spinner } from '../ui/Spinner';

interface TimelineListProps {
  tweets: Tweet[];
  isLoading: boolean;
  error?: { message: string } | null;
  onLike: (tweetId: string) => void;
  onRetweet: (tweetId: string) => void;
}

export function TimelineList({
  tweets,
  isLoading,
  error,
  onLike,
  onRetweet,
}: TimelineListProps) {
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">エラーが発生しました: {error.message}</p>
      </div>
    );
  }

  if (isLoading && tweets.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          まだツイートがありません
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {tweets.map((tweet) => (
        <TimelineItem
          key={tweet.id}
          tweet={tweet}
          onLike={onLike}
          onRetweet={onRetweet}
        />
      ))}
      {isLoading && (
        <div className="p-4 flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}