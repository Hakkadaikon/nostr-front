"use client";

import { useState, useRef, useEffect } from 'react';
import { useTweets } from '../../features/tweets/hooks/useTweets';
import { Tweet } from '../../features/timeline/types';
import { Image, Smile, Calendar, MapPin, X } from 'lucide-react';

interface TweetComposerProps {
  onTweetCreated?: (tweet: Tweet) => void;
  placeholder?: string;
  maxHeight?: string;
}

export function TweetComposer({ 
  onTweetCreated, 
  placeholder = "いまどうしてる？",
  maxHeight = "200px"
}: TweetComposerProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { postTweet, isPosting, error, clearError } = useTweets();

  // 文字数計算
  const charCount = content.length;
  const remainingChars = 280 - charCount;
  const isOverLimit = charCount > 280;
  const isNearLimit = charCount > 260;

  // テキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, parseInt(maxHeight))}px`;
    }
  }, [content, maxHeight]);

  // 投稿処理
  const handleSubmit = async () => {
    if (content.trim() === '' || isOverLimit || isPosting) return;

    const tweet = await postTweet(content);
    if (tweet) {
      setContent('');
      setIsExpanded(false);
      if (onTweetCreated) {
        onTweetCreated(tweet);
      }
    }
  };

  // エラーをクリア
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors duration-200">
      <div className="flex gap-3">
        {/* アバター */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
        
        <div className="flex-1">
          {/* テキストエリア */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="w-full p-3 text-xl bg-transparent text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none overflow-y-auto"
            placeholder={placeholder}
            style={{ minHeight: isExpanded ? '100px' : '56px' }}
            disabled={isPosting}
          />

          {/* エラーメッセージ */}
          {error && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              <X size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 下部コントロール */}
          {(isExpanded || content.length > 0) && (
            <div className="flex justify-between items-center mt-3">
              {/* アクションボタン */}
              <div className="flex gap-1">
                <button
                  className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 transition-all duration-200 hover:scale-110"
                  title="画像を追加"
                  disabled={isPosting}
                >
                  <Image size={20} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 transition-all duration-200 hover:scale-110"
                  title="絵文字"
                  disabled={isPosting}
                >
                  <Smile size={20} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 transition-all duration-200 hover:scale-110"
                  title="予約投稿"
                  disabled={isPosting}
                >
                  <Calendar size={20} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 transition-all duration-200 hover:scale-110"
                  title="位置情報"
                  disabled={isPosting}
                >
                  <MapPin size={20} />
                </button>
              </div>

              {/* 文字数と投稿ボタン */}
              <div className="flex items-center gap-3">
                {/* 文字数カウンター */}
                {content.length > 0 && (
                  <div className="relative">
                    <span 
                      className={`text-sm ${
                        isOverLimit ? 'text-red-500' : 
                        isNearLimit ? 'text-yellow-500' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {remainingChars}
                    </span>
                    {/* プログレスリング */}
                    <svg className="absolute -inset-2 w-10 h-10 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-300 dark:text-gray-700"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 16}`}
                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - Math.min(charCount / 280, 1))}`}
                        className={
                          isOverLimit ? 'text-red-500' : 
                          isNearLimit ? 'text-yellow-500' : 
                          'text-purple-500'
                        }
                      />
                    </svg>
                  </div>
                )}

                {/* 投稿ボタン */}
                <button
                  onClick={handleSubmit}
                  disabled={content.trim() === '' || isOverLimit || isPosting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {isPosting ? '投稿中...' : 'ポストする'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}