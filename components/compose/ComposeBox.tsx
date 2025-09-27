"use client";
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useEffect, useState } from 'react';
import { publishNote } from '../../features/notes/publish';
import { saveDraft, loadDraft, removeDraft } from '../../lib/storage/draftStore';
import { useToast } from '../../hooks/useToast';
import { useProfileStore } from '../../stores/profile.store';
import { Avatar } from '../ui/Avatar';

const DRAFT_KEY = 'compose:main';

export default function ComposeBox() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const { current } = useProfileStore();

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

  const onPost = async () => {
    setLoading(true);
    try {
      const r = await publishNote(text);
      const failed = r.results.filter(x => !x.ok).map(x => x.relay);
      if (r.ok) {
        setText('');
        await removeDraft(DRAFT_KEY);
        show(`Posted to ${r.results.length - failed.length}/${r.results.length} relays`);
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
    <div className="space-y-2 rounded border p-3">
      <div className="flex space-x-2">
        <Avatar src={current?.picture} />
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="いまどうしてる？" rows={3} />
      </div>
      <div className="text-right">
        <Button variant="primary" disabled={!text.trim() || loading} onClick={onPost}>
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}
