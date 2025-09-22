"use client";

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { TweetComposer } from './TweetComposer';
import { Tweet } from '../../features/timeline/types';
import { SafeImage } from '../ui/SafeImage';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X } from 'lucide-react';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyToTweet: Tweet | null;
  onReplyCreated?: (tweet: Tweet) => void;
}

export function ReplyModal({ isOpen, onClose, replyToTweet, onReplyCreated }: ReplyModalProps) {
  if (!replyToTweet) return null;

  const timeAgo = formatDistanceToNow(new Date(replyToTweet.createdAt), {
    addSuffix: true,
    locale: ja,
  });

  const handleReplyCreated = (tweet: Tweet) => {
    onReplyCreated?.(tweet);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">返信</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 返信先ツイートの表示 */}
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
          <div className="flex gap-3">
            {/* アバター */}
            <div className="flex-shrink-0">
              {replyToTweet.author.avatar ? (
                <SafeImage
                  src={replyToTweet.author.avatar}
                  alt={replyToTweet.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* ヘッダー */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-gray-900 dark:text-white">
                  {replyToTweet.author.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  @{replyToTweet.author.username}
                </span>
                <span className="text-gray-500 dark:text-gray-400">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {timeAgo}
                </span>
              </div>
              
              {/* コンテンツ */}
              <div className="mt-1 text-gray-900 dark:text-white">
                {replyToTweet.content}
              </div>
            </div>
          </div>
        </div>
        
        {/* 返信入力エリア */}
        <div className="-mx-4">
          <TweetComposer
            onTweetCreated={handleReplyCreated}
            placeholder={`@${replyToTweet.author.username} への返信を入力`}
            replyTo={{
              tweetId: replyToTweet.id,
              username: replyToTweet.author.username
            }}
          />
        </div>
      </div>
    </Modal>
  );
}