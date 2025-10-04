"use client";
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useEffect, useState, useRef } from 'react';
import { publishNote } from '../../features/notes/publish';
import { saveDraft, loadDraft, removeDraft } from '../../lib/storage/draftStore';
import { useToast } from '../../hooks/useToast';
import { useProfileStore } from '../../stores/profile.store';
import { Avatar } from '../ui/Avatar';
import { MentionSuggestion } from './MentionSuggestion';
import { MediaUploader } from './MediaUploader';
import { X } from 'lucide-react';

const DRAFT_KEY = 'compose:main';

export default function ComposeBox() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const { current } = useProfileStore();
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await loadDraft(DRAFT_KEY);
      if (d) setText(d);
    })();
  }, []);

  useEffect(() => {
    const h = setTimeout(() => {
      if (text.trim()) {
        saveDraft(DRAFT_KEY, text);
      } else {
        removeDraft(DRAFT_KEY);
      }
    }, 500);
    return () => clearTimeout(h);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newCursor = e.target.selectionStart;
    setText(newText);
    setCursorPosition(newCursor);

    const textBeforeCursor = newText.slice(0, newCursor);
    // @の直後から候補を表示するため、\w*を.*?に変更（空文字も許容）
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

  const onPost = async () => {
    setLoading(true);
    try {
      const r = await publishNote(text);
      const failed = r.results.filter(x => !x.ok).map(x => x.relay);
      if (r.ok) {
        setText('');
        await removeDraft(DRAFT_KEY);
        show(`Posted to ${r.results.length - failed.length}/${r.results.length} relays`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('timeline:refresh'));
        }
      } else {
        show(`Failed to post. Failed relays: ${failed.join(', ')}`);
      }
    } catch (e: any) {
      show(`Post failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={`space-y-2 rounded border p-3 relative transition-colors ${
        isDragging ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex space-x-2">
        <Avatar src={current?.picture} />
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onPaste={handlePaste}
          placeholder="いまどうしてる？"
          rows={3}
        />
      </div>

      {/* メディアプレビュー */}
      {selectedMedia.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MediaUploader
            onMediaSelect={setSelectedMedia}
            disabled={loading}
            selectedMedia={selectedMedia}
            onRemoveMedia={handleRemoveMedia}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {text.length} 文字
          </span>
        </div>
        <Button variant="primary" disabled={!text.trim() || loading} onClick={onPost}>
          {loading ? '投稿中...' : '投稿する'}
        </Button>
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
