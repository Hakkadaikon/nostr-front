"use client";

import { useState } from 'react';
import { Tweet } from '../../features/timeline/types';
import { TimelineItem } from './TimelineItem';
import { Spinner } from '../ui/Spinner';
import { ZapModal } from '../zap/ZapModal';
import { ReplyModal } from '../tweets/ReplyModal';

interface TimelineListProps {
  tweets: Tweet[];
  isLoading: boolean;
  error?: { message: string } | null;
  onLike: (tweetId: string) => void;
  onRetweet: (tweetId: string) => void;
  emptyMessage?: string;
}

export function TimelineList({
  tweets,
  isLoading,
  error,
  onLike,
  onRetweet,
  emptyMessage = 'まだツイートがありません',
}: TimelineListProps) {
  const [zapModalOpen, setZapModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedTweetId, setSelectedTweetId] = useState<string>('');
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
  const [replyToTweet, setReplyToTweet] = useState<Tweet | null>(null);

  const handleZap = (tweetId: string) => {
    const tweet = tweets.find(t => t.id === tweetId);
    if (tweet) {
      setSelectedTweetId(tweetId);
      setSelectedTweet(tweet);
      setZapModalOpen(true);
    }
  };

  const handleReply = (tweet: Tweet) => {
    setReplyToTweet(tweet);
    setReplyModalOpen(true);
  };

  const handleReplyCreated = (newTweet: Tweet) => {
    // 返信が作成されたら、タイムラインに追加するロジックをここに実装
    // 現在は親コンポーネントでリフレッシュ等の処理を行う想定
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
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
        {tweets.map((tweet) => (
          <TimelineItem
            key={tweet.id}
            tweet={tweet}
            onLike={onLike}
            onRetweet={onRetweet}
            onZap={handleZap}
            onReply={handleReply}
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
      <ReplyModal
        isOpen={replyModalOpen}
        onClose={() => {
          setReplyModalOpen(false);
          setReplyToTweet(null);
        }}
        replyToTweet={replyToTweet}
        onReplyCreated={handleReplyCreated}
      />
    </>
  );
}