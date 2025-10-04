"use client";

import { useState, useEffect } from 'react';
import { fetchFollowList } from '../services/follow';

export function useFollowCount(pubkey?: string) {
  const [followCount, setFollowCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pubkey) return;

    const getFollowCount = async () => {
      setIsLoading(true);
      try {
        const followList = await fetchFollowList(pubkey);
        setFollowCount(followList.length);
      } catch (error) {
        setFollowCount(null);
      } finally {
        setIsLoading(false);
      }
    };

    getFollowCount();
  }, [pubkey]);

  return { followCount, isLoading };
}
