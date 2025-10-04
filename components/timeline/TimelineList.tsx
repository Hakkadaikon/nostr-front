"use client";

import React, { useState } from 'react';
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
  hideReactions?: boolean;
}

export function TimelineList({
  tweets,
  isLoading,
  error,
  onLike,
  onRetweet,
  emptyMessage = 'まだツイートがありません',
  hideReactions = false,
}: TimelineListProps) {
  const [zapModalOpen, setZapModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedTweetId, setSelectedTweetId] = useState<string>('');
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
  const [replyToTweet, setReplyToTweet] = useState<Tweet | null>(null);
  const [deletedTweetIds, setDeletedTweetIds] = useState<Set<string>>(new Set());

  // 削除されたツイートを除外してフィルタリング（ローカル状態を使わずメモ化）
  const displayTweets = React.useMemo(() => {
    return tweets.filter(tweet => !deletedTweetIds.has(tweet.id));
  }, [tweets, deletedTweetIds]);

  const handleZap = (tweetId: string) => {
    const tweet = displayTweets.find(t => t.id === tweetId);
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

  const handleDelete = (tweetId: string) => {
    // 削除されたツイートIDをSetに追加（不変更新）
    setDeletedTweetIds(prev => new Set(prev).add(tweetId));
  };
  if (error && tweets.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <p className="text-red-500 font-medium">タイムラインの取得に失敗しました</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          ページを再読み込みするか、しばらく待ってから再度お試しください。
        </p>
      </div>
    );
  }

  // エラーがあるが既存のツイートがある場合（フォールバック表示）
  if (error && tweets.length > 0) {
  }

  if (isLoading && tweets.length === 0) {
    return (
      <div className="p-6 sm:p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (displayTweets.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
        {displayTweets.map((tweet) => {
          const key = tweet.activity?.sourceEventId ?? tweet.id;
          return (
          <TimelineItem
            key={key}
            tweet={tweet}
            onLike={onLike}
            onRetweet={onRetweet}
            onZap={handleZap}
            onReply={handleReply}
            onDelete={handleDelete}
            hideReactions={hideReactions}
          />
          );
        })}
        {isLoading && (
          <div className="p-3 sm:p-4 flex justify-center">
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
