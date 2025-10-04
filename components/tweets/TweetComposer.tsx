"use client";

import { useState, useRef, useEffect } from 'react';
import { useTweets } from '../../features/tweets/hooks/useTweets';
import { Tweet } from '../../features/timeline/types';
import { Image, Smile, X, Hash, AtSign } from 'lucide-react';
import { EmojiPicker } from '../compose/EmojiPicker';
import { MediaUploader } from '../compose/MediaUploader';
import { useProfileStore } from '../../stores/profile.store';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../stores/auth.store';
import { fetchProfile } from '../../features/profile/fetchProfile';
import { MentionSuggestion } from '../compose/MentionSuggestion';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { postTweet, isPosting, error, clearError } = useTweets();
  const { current: currentProfile, setCurrent } = useProfileStore();
  const { publicKey } = useAuthStore();
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ログインユーザーのプロフィール情報を取得
  useEffect(() => {
    if (publicKey && !currentProfile) {
      fetchProfile(publicKey).then((profile) => {
        if (profile) {
          // hex pubkey の場合は npub を生成
          try {
            if (!profile.npub && publicKey.startsWith('npub1') === false) {
              const { nip19 } = require('nostr-tools');
              profile.npub = nip19.npubEncode(publicKey);
            }
          } catch {}
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

  // テキスト変更時のメンション検出
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newCursor = e.target.selectionStart;
    setContent(newContent);
    setCursorPosition(newCursor);

    const textBeforeCursor = newContent.slice(0, newCursor);
    // @の直後から候補を表示するため、空文字も許容
    const match = textBeforeCursor.match(/@([^\s@]*)$/);

    if (match) {
      const query = match[1]; // 空文字列の場合もある
      setMentionQuery(query);
      setShowMentions(true);

      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // メンション選択
  const handleMentionSelect = (profile: { pubkey: string; name: string; npub: string }) => {
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    const mentionStartIndex = textBeforeCursor.lastIndexOf('@');

    const nostrUri = `nostr:${profile.npub}`;
    const newContent =
      content.slice(0, mentionStartIndex) +
      nostrUri +
      ' ' +
      textAfterCursor;

    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + nostrUri.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
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

  // ファイル処理（ドラッグ&ドロップとクリップボード共通）
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (imageFiles.length > 0) {
      setSelectedMedia(prev => [...prev, ...imageFiles]);
    }
  };

  // ドラッグ&ドロップイベントハンドラ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // クリップボード貼り付けハンドラ
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
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
    <div
      className={`border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors duration-200 ${
        isDragging ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex gap-3 sm:gap-4">
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
            onChange={handleContentChange}
            onFocus={() => setIsExpanded(true)}
            onPaste={handlePaste}
            className="w-full p-3 text-lg sm:text-xl bg-transparent text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none overflow-y-auto"
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
            <div className={`mt-3 grid gap-2 max-w-full ${
              selectedMedia.length === 1 ? 'grid-cols-1' : 
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}>
              {selectedMedia.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {file.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                  />
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    disabled={isPosting}
                  />
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
        </div>
      </div>
      {showMentions && (
        <MentionSuggestion
          query={mentionQuery}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentions(false)}
          position={mentionPosition}
        />
      )}
    </div>
  );
}