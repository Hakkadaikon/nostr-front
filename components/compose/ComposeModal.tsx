"use client";
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useEffect, useState } from 'react';
import { publishNote } from '../../features/notes/publish';
import { saveDraft, loadDraft, removeDraft } from '../../lib/storage/draftStore';
import { useToast } from '../../hooks/useToast';
import { useUiStore } from '../../stores/ui.store';
import { X } from 'lucide-react';

const DRAFT_KEY = 'compose:modal';

export default function ComposeModal() {
  const isOpen = useUiStore(state => state.isComposeModalOpen);
  const closeModal = useUiStore(state => state.closeComposeModal);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

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

  const handleClose = () => {
    closeModal();
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
        closeModal();
        // タイムラインを更新するイベントをディスパッチ
        window.dispatchEvent(new CustomEvent('note-published'));
      } else {
        show(`Failed to post. Failed relays: ${failed.join(', ')}`);
      }
    } catch (e: any) {
      show(`Post failed: ${e?.message || e}`);
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
          <Textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="いまどうしてる？" 
            rows={6}
            className="w-full resize-none border-0 focus:ring-0 text-lg bg-transparent"
            autoFocus
          />
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {text.length} 文字
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handleClose}
                disabled={loading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                キャンセル
              </Button>
              <Button 
                disabled={!text.trim() || loading} 
                onClick={onPost}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}