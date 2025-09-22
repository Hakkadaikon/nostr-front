"use client";

import { useState, useRef, useEffect } from 'react';
import { useTweets } from '../../features/tweets/hooks/useTweets';
import { Tweet } from '../../features/timeline/types';
import { Image, Smile, Calendar, MapPin, X, Hash, AtSign, Eye } from 'lucide-react';
import { EmojiPicker } from '../compose/EmojiPicker';
import { MediaUploader } from '../compose/MediaUploader';

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
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
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

  // ハッシュタグとメンションの抽出
  const extractHashtags = (text: string): string[] => {
    const regex = /#[^\s#]+/g;
    return (text.match(regex) || []).map(tag => tag.substring(1));
  };

  const extractMentions = (text: string): string[] => {
    const regex = /@[^\s@]+/g;
    return (text.match(regex) || []).map(mention => mention.substring(1));
  };

  // 絵文字の挿入
  const handleEmojiSelect = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      
      // カーソル位置を絵文字の後に移動
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + emoji.length;
          textareaRef.current.selectionEnd = start + emoji.length;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // メディアの削除
  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  // 投稿処理
  const handleSubmit = async () => {
    if (content.trim() === '' || isOverLimit || isPosting) return;

    const hashtags = extractHashtags(content);
    const mentions = extractMentions(content);

    const tweet = await postTweet(content, selectedMedia, hashtags, mentions, undefined);
    if (tweet) {
      setContent('');
      setSelectedMedia([]);
      setIsExpanded(false);
      setShowPreview(false);
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
                <MediaUploader
                  onMediaSelect={setSelectedMedia}
                  disabled={isPosting}
                  selectedMedia={selectedMedia}
                  onRemoveMedia={handleRemoveMedia}
                />
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  disabled={isPosting}
                />
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 transition-all duration-200 hover:scale-110"
                  title="プレビュー"
                  disabled={isPosting}
                >
                  <Eye size={20} />
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

          {/* プレビューエリア */}
          {showPreview && content.trim() && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">プレビュー</div>
              <div className="whitespace-pre-wrap break-words">
                {content.split(/(#[^\s#]+|@[^\s@]+)/g).map((part, i) => {
                  if (part.startsWith('#')) {
                    return <span key={i} className="text-purple-600 dark:text-purple-400 font-semibold">{part}</span>;
                  } else if (part.startsWith('@')) {
                    return <span key={i} className="text-blue-600 dark:text-blue-400 font-semibold">{part}</span>;
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
              {selectedMedia.length > 0 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {selectedMedia.length}個のメディアファイル
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}