"use client";

import { useState, useEffect } from 'react';
import { followUser, unfollowUser, isFollowing } from '../../profile/follow';
import { useAuthStore } from '../../../stores/auth.store';

export interface UseFollowResult {
  isFollowing: boolean;
  isLoading: boolean;
  error: string | null;
  handleFollow: () => Promise<void>;
  handleUnfollow: () => Promise<void>;
  toggleFollow: () => Promise<void>;
}

export function useFollow(targetUserNpubOrPubkey: string | undefined): UseFollowResult {
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useAuthStore();

  // フォロー状態をチェック
  useEffect(() => {
    if (!targetUserNpubOrPubkey || !publicKey) return;

    const checkFollowStatus = async () => {
      try {
        setIsLoading(true);
        const following = await isFollowing(targetUserNpubOrPubkey);
        setIsFollowingState(following);
      } catch (err) {
        console.error('Failed to check follow status:', err);
        setError('フォロー状態の確認に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [targetUserNpubOrPubkey, publicKey]);

  const handleFollow = async () => {
    if (!targetUserNpubOrPubkey) return;

    try {
      setIsLoading(true);
      setError(null);
      await followUser(targetUserNpubOrPubkey);
      setIsFollowingState(true);
    } catch (err) {
      console.error('Failed to follow user:', err);
      setError('フォローに失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!targetUserNpubOrPubkey) return;

    try {
      setIsLoading(true);
      setError(null);
      await unfollowUser(targetUserNpubOrPubkey);
      setIsFollowingState(false);
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      setError('アンフォローに失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (isFollowingState) {
      await handleUnfollow();
    } else {
      await handleFollow();
    }
  };

  return {
    isFollowing: isFollowingState,
    isLoading,
    error,
    handleFollow,
    handleUnfollow,
    toggleFollow,
  };
}