"use client";

import { useState, useCallback } from 'react';
import { createTweet } from '../services/tweets';
import { CreateTweetRequest } from '../types';
import { Tweet } from '../../timeline/types';

interface UseTweetsReturn {
  isPosting: boolean;
  error: string | null;
  postTweet: (content: string) => Promise<Tweet | null>;
  clearError: () => void;
}

/**
 * ツイート投稿機能のカスタムフック
 */
export function useTweets(): UseTweetsReturn {
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postTweet = useCallback(async (content: string): Promise<Tweet | null> => {
    setIsPosting(true);
    setError(null);

    try {
      const request: CreateTweetRequest = {
        content: content.trim(),
      };

      const response = await createTweet(request);
      return response.tweet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ツイートの投稿に失敗しました';
      setError(errorMessage);
      return null;
    } finally {
      setIsPosting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isPosting,
    error,
    postTweet,
    clearError,
  };
}