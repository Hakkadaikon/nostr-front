import { useState, useEffect } from 'react';
import { createReaction, deleteReaction, getMyReaction } from '../services/reaction';
import { useToast } from '../../../hooks/useToast';

interface UseReactionOptions {
  eventId: string;
  authorPubkey?: string;
}

export function useReaction({ eventId, authorPubkey }: UseReactionOptions) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reactionEventId, setReactionEventId] = useState<string | null>(null);
  const { showToast } = useToast();

  // 初期ロード時に既存のリアクションをチェック
  useEffect(() => {
    const checkExistingReaction = async () => {
      try {
        const reaction = await getMyReaction(eventId);
        if (reaction) {
          setIsLiked(true);
          setReactionEventId(reaction.id);
        }
      } catch (error) {
        console.error('Failed to check existing reaction:', error);
      }
    };

    checkExistingReaction();
  }, [eventId]);

  const toggleLike = async () => {
    if (!authorPubkey) {
      showToast('エラー: 投稿者の情報が見つかりません', 'error');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      if (isLiked && reactionEventId) {
        // いいねを取り消す
        await deleteReaction(reactionEventId);
        setIsLiked(false);
        setReactionEventId(null);
      } else {
        // いいねする
        const reaction = await createReaction(eventId, authorPubkey);
        setIsLiked(true);
        setReactionEventId(reaction.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('いいねの処理に失敗しました', 'error');
      // エラー時は元の状態に戻す
      setIsLiked(!isLiked);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    isLoading,
    toggleLike
  };
}