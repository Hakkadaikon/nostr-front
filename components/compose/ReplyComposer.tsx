"use client";

import { useState } from 'react';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { publishNote } from '../../features/notes/publish';
import { useToast } from '../../hooks/useToast';
import { X } from 'lucide-react';
import { NotificationUser } from '../../types/notification';

interface ReplyComposerProps {
  replyTo: string;
  replyToUser: NotificationUser;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReplyComposer({ replyTo, replyToUser, onClose, onSuccess }: ReplyComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await publishNote(content, {
        replyToId: replyTo,
        replyAuthor: replyToUser.pubkey
      });

      show(`@${replyToUser.name} への返信を送信しました`);

      setContent('');
      onSuccess?.();
    } catch (error) {
      let errorMessage = '返信の送信に失敗しました';

      if (error instanceof Error) {
        if (error.message.includes('No signing method available')) {
          errorMessage = 'Nostr拡張機能または秘密鍵が必要です';
        } else if (error.message.includes('Invalid secret key format')) {
          errorMessage = '秘密鍵の形式が正しくありません';
        } else if (error.message.includes('NIP-07 signing failed')) {
          errorMessage = 'Nostr拡張機能での署名に失敗しました';
        } else if (error.message.includes('No secret key provided')) {
          errorMessage = '秘密鍵が設定されていません';
        }
      }

      show(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            @{replyToUser.name} への返信
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="返信を入力..."
          rows={3}
          className="resize-none"
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? <Spinner size="small" /> : '返信'}
          </Button>
        </div>
      </form>
    </div>
  );
}
