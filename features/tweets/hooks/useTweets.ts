"use client";

import { useState, useCallback } from 'react';
import { createTweet } from '../services/tweets';
import { CreateTweetRequest } from '../types';
import { Tweet } from '../../timeline/types';

interface UseTweetsReturn {
  isPosting: boolean;
  error: string | null;
  postTweet: (
    content: string, 
    media?: File[], 
    hashtags?: string[], 
    mentions?: string[], 
    replyInfo?: { 
      parentId: string; 
      parentAuthor?: string;
      rootId?: string;
      rootAuthor?: string;
    }
  ) => Promise<Tweet | null>;
  clearError: () => void;
}

/**
 * ツイート投稿機能のカスタムフック
 */
export function useTweets(): UseTweetsReturn {
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postTweet = useCallback(async (
    content: string, 
    media?: File[], 
    hashtags?: string[], 
    mentions?: string[],
    replyInfo?: { 
      parentId: string; 
      parentAuthor?: string;
      rootId?: string;
      rootAuthor?: string;
    }
  ): Promise<Tweet | null> => {
    setIsPosting(true);
    setError(null);

    try {
      const request: CreateTweetRequest = {
        content: content.trim(),
        media,
        hashtags,
        mentions,
        parentId: replyInfo?.parentId,
        parentAuthor: replyInfo?.parentAuthor,
        rootId: replyInfo?.rootId,
        rootAuthor: replyInfo?.rootAuthor,
      };

      const response = await createTweet(request);
      return response.tweet;
    } catch (err) {
      console.error('Failed to post tweet:', err);
      let errorMessage = 'ツイートの投稿に失敗しました';

      if (err instanceof Error) {
        if (err.message.includes('No signing method available')) {
          errorMessage = 'Nostr拡張機能または秘密鍵が必要です';
        } else if (err.message.includes('Invalid secret key format')) {
          errorMessage = '秘密鍵の形式が正しくありません';
        } else if (err.message.includes('NIP-07 signing failed')) {
          errorMessage = 'Nostr拡張機能での署名に失敗しました';
        } else if (err.message.includes('No secret key provided')) {
          errorMessage = '秘密鍵が設定されていません';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

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