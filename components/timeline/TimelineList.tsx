"use client";

import { useState } from 'react';
import { Tweet } from '../../features/timeline/types';
import { TimelineItem } from './TimelineItem';
import { Spinner } from '../ui/Spinner';
import { ZapModal } from '../zap/ZapModal';

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
  const [zapModalOpen, setZapModalOpen] = useState(false);
  const [selectedTweetId, setSelectedTweetId] = useState<string>('');
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);

  const handleZap = (tweetId: string) => {
    const tweet = tweets.find(t => t.id === tweetId);
    if (tweet) {
      setSelectedTweetId(tweetId);
      setSelectedTweet(tweet);
      setZapModalOpen(true);
    }
  };
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
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {tweets.map((tweet) => (
          <TimelineItem
            key={tweet.id}
            tweet={tweet}
            onLike={onLike}
            onRetweet={onRetweet}
            onZap={handleZap}
          />
        ))}
        {isLoading && (
          <div className="p-4 flex justify-center">
            <Spinner />
          </div>
        )}
      </div>
      <ZapModal
        isOpen={zapModalOpen}
        onClose={() => {
          setZapModalOpen(false);
          setSelectedTweetId('');
          setSelectedTweet(null);
        }}
        tweetId={selectedTweetId}
        recipientNpub={selectedTweet?.author.id || ''}
        recipientLnAddress={(selectedTweet?.author as any)?.lud16}
      />
    </>
  );
}