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

  useEffect(() => {
    (async () => {
      const d = await loadDraft(DRAFT_KEY);
      if (d) setText(d);
    })();
  }, []);

  useEffect(() => {
    const h = setTimeout(() => {
      if (text.trim()) saveDraft(DRAFT_KEY, text);
    }, 500);
    return () => clearTimeout(h);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    <div className="space-y-2 rounded border p-3 relative">
      <div className="flex space-x-2">
        <Avatar src={current?.picture} />
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="いまどうしてる？"
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {text.length} 文字
        </span>
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
