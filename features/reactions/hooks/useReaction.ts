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
  const { show } = useToast();

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
      show('エラー: 投稿者の情報が見つかりません');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      if (isLiked && reactionEventId) {
        await deleteReaction(reactionEventId);
        setIsLiked(false);
        setReactionEventId(null);
      } else {
        const reaction = await createReaction(eventId, authorPubkey);
        setIsLiked(true);
        setReactionEventId(reaction.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      show('いいねの処理に失敗しました');
      setIsLiked(!isLiked);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    isLoading,
    toggleLike,
  };
}
