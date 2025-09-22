"use client";

import { useState, useRef, useEffect } from 'react';
import { useTweets } from '../../features/tweets/hooks/useTweets';
import { Tweet } from '../../features/timeline/types';
import { Image, Smile, X, Hash, AtSign, Eye } from 'lucide-react';
import { EmojiPicker } from '../compose/EmojiPicker';
import { MediaUploader } from '../compose/MediaUploader';
import { useProfileStore } from '../../stores/profile.store';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../stores/auth.store';
import { fetchProfile } from '../../features/profile/fetchProfile';

interface TweetComposerProps {
  onTweetCreated?: (tweet: Tweet) => void;
  placeholder?: string;
  maxHeight?: string;
  replyTo?: {
    tweetId: string;
    username: string;
    authorPubkey?: string;
    rootId?: string;
    rootAuthorPubkey?: string;
  };
}

export function TweetComposer({ 
  onTweetCreated, 
  placeholder = "いまどうしてる？",
  maxHeight = "200px",
  replyTo
}: TweetComposerProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { postTweet, isPosting, error, clearError } = useTweets();
  const { current: currentProfile, setCurrent } = useProfileStore();
  const { publicKey } = useAuthStore();

  // ログインユーザーのプロフィール情報を取得
  useEffect(() => {
    if (publicKey && !currentProfile) {
      fetchProfile(publicKey).then((profile) => {
        if (profile) {
          setCurrent(profile);
        }
      });
    }
  }, [publicKey, currentProfile, setCurrent]);

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
    if (content.trim() === '' || isPosting) return;
    
    // 入力検証
    const sanitizedContent = content.trim();

    const hashtags = extractHashtags(content);
    const mentions = extractMentions(content);

    const replyInfo = replyTo ? {
      parentId: replyTo.tweetId,
      parentAuthor: replyTo.authorPubkey,
      rootId: replyTo.rootId,
      rootAuthor: replyTo.rootAuthorPubkey,
    } : undefined;

    const tweet = await postTweet(sanitizedContent, selectedMedia, hashtags, mentions, replyInfo);
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
        <Avatar 
          src={currentProfile?.picture} 
          alt={currentProfile?.name || 'user'} 
        />
        
        <div className="flex-1">
          {/* 返信先の表示 */}
          {replyTo && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>@{replyTo.username} への返信</span>
            </div>
          )}
          
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

          {/* メディアプレビュー */}
          {selectedMedia.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 max-w-full">
              {selectedMedia.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : file.type.startsWith('video/') ? (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute -top-2 -right-2 bg-gray-900 dark:bg-gray-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 下部コントロール */}
          {(isExpanded || content.length > 0) && (
            <div className="mt-3">
              <div className="flex justify-between items-center">
                {/* アクションボタン */}
                <div className="flex gap-1">
                  <MediaUploader
                    onMediaSelect={setSelectedMedia}
                    disabled={isPosting}
                    selectedMedia={selectedMedia}
                    onRemoveMedia={handleRemoveMedia}
                    hidePreview={true}
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
                </div>

              {/* 投稿ボタン */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={content.trim() === '' || isPosting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {isPosting ? '投稿中...' : 'ポストする'}
                </button>
              </div>
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