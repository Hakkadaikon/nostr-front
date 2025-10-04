"use client";
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useEffect, useState, useRef } from 'react';
import { publishNote } from '../../features/notes/publish';
import { saveDraft, loadDraft, removeDraft } from '../../lib/storage/draftStore';
import { useToast } from '../../hooks/useToast';
import { useUiStore } from '../../stores/ui.store';
import { X, Image, Smile } from 'lucide-react';
import { MediaUploader } from './MediaUploader';
import { EmojiPicker } from './EmojiPicker';
import { useProfileStore } from '../../stores/profile.store';
import { Avatar } from '../ui/Avatar';
import { useTweets } from '../../features/tweets/hooks/useTweets';
import { MentionSuggestion } from './MentionSuggestion';

const DRAFT_KEY = 'compose:modal';

export default function ComposeModal() {
  const isOpen = useUiStore(state => state.isComposeModalOpen);
  const closeModal = useUiStore(state => state.closeComposeModal);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { show } = useToast();
  const { postTweet, error, clearError } = useTweets();
  const { current: currentProfile } = useProfileStore();
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        const d = await loadDraft(DRAFT_KEY);
        if (d) setText(d);
      })();
    }
  }, [isOpen]);

  useEffect(() => {
    const h = setTimeout(() => {
      if (text.trim() && isOpen) saveDraft(DRAFT_KEY, text);
    }, 500);
    return () => clearTimeout(h);
  }, [text, isOpen]);

  // エラーをクリア
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleClose = () => {
    closeModal();
    setSelectedMedia([]);
    setShowMentions(false);
  };

  const handleMentionSelect = (profile: { pubkey: string; name: string; npub: string }) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const textAfterCursor = text.slice(cursorPosition);
    const mentionStartIndex = textBeforeCursor.lastIndexOf('@');

    const nostrUri = `nostr:${profile.npub}`;
    const newText =
      text.slice(0, mentionStartIndex) +
      nostrUri +
      ' ' +
      textAfterCursor;

    setText(newText);
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
      const newContent = text.slice(0, start) + emoji + text.slice(end);
      setText(newContent);

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

  const onPost = async () => {
    if (text.trim() === '' || loading) return;

    setLoading(true);
    try {
      // ハッシュタグとメンションの抽出
      const hashtags = (text.match(/#[^\s#]+/g) || []).map(tag => tag.substring(1));
      const mentions = (text.match(/@[^\s@]+/g) || []).map(mention => mention.substring(1));

      const tweet = await postTweet(text, selectedMedia, hashtags, mentions);
      if (tweet) {
        setText('');
        setSelectedMedia([]);
        await removeDraft(DRAFT_KEY);
        show('投稿が完了しました');
        closeModal();
      }
    } catch (e: any) {
      show(`投稿に失敗しました: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div 
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">新しい投稿</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-3">
            <Avatar
              src={currentProfile?.picture}
              alt={currentProfile?.name || 'user'}
            />
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  const newText = e.target.value;
                  const newCursor = e.target.selectionStart;
                  setText(newText);
                  setCursorPosition(newCursor);

                  const textBeforeCursor = newText.slice(0, newCursor);
                  const match = textBeforeCursor.match(/@(\w*)$/);

                  if (match) {
                    const query = match[1];
                    setMentionQuery(query);
                    setShowMentions(true);

                    if (textareaRef.current) {
                      const rect = textareaRef.current.getBoundingClientRect();
                      setMentionPosition({
                        top: rect.bottom,
                        left: rect.left,
                      });
                    }
                  } else {
                    setShowMentions(false);
                    setMentionQuery('');
                  }
                }}
                placeholder="いまどうしてる？"
                rows={6}
                className="w-full resize-none border-0 focus:ring-0 text-lg bg-transparent"
                autoFocus
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
                <div className={`mt-3 grid gap-2 ${
                  selectedMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                }`}>
                  {selectedMedia.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
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
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1">
              <MediaUploader
                onMediaSelect={setSelectedMedia}
                disabled={loading}
                selectedMedia={selectedMedia}
                onRemoveMedia={handleRemoveMedia}
              />
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {text.length} 文字
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  disabled={loading}
                  variant="secondary"
                >
                  キャンセル
                </Button>
                <Button
                  disabled={!text.trim() || loading}
                  onClick={onPost}
                  variant="primary"
                >
                  {loading ? '投稿中...' : '投稿する'}
                </Button>
              </div>
            </div>
          </div>
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