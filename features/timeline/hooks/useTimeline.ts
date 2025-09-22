"use client";

import { useCallback, useEffect, useReducer } from 'react';
import { fetchTimeline, likeTweet, unlikeTweet, retweet, undoRetweet } from '../services/timeline';
import { TimelineParams, TimelineState, Tweet } from '../types';

// Action types
type TimelineAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; tweets: Tweet[]; nextCursor?: string; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: Error }
  | { type: 'TOGGLE_LIKE'; tweetId: string }
  | { type: 'TOGGLE_RETWEET'; tweetId: string }
  | { type: 'ADD_TWEET'; tweet: Tweet }
  | { type: 'RESET' };

// Reducer
function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    
    case 'FETCH_SUCCESS':
      return {
        ...state,
        tweets: [...state.tweets, ...action.tweets],
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        isLoading: false,
        error: null,
      };
    
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: {
          code: 'FETCH_ERROR',
          message: action.error.message,
          details: action.error,
        },
      };
    
    case 'TOGGLE_LIKE':
      return {
        ...state,
        tweets: state.tweets.map(tweet => {
          if (tweet.id === action.tweetId) {
            return {
              ...tweet,
              isLiked: !tweet.isLiked,
              likesCount: tweet.isLiked ? tweet.likesCount - 1 : tweet.likesCount + 1,
            };
          }
          return tweet;
        }),
      };
    
    case 'TOGGLE_RETWEET':
      return {
        ...state,
        tweets: state.tweets.map(tweet => {
          if (tweet.id === action.tweetId) {
            return {
              ...tweet,
              isRetweeted: !tweet.isRetweeted,
              retweetsCount: tweet.isRetweeted ? tweet.retweetsCount - 1 : tweet.retweetsCount + 1,
            };
          }
          return tweet;
        }),
      };
    
    case 'ADD_TWEET':
      return {
        ...state,
        tweets: [action.tweet, ...state.tweets],
      };
    
    case 'RESET':
      return {
        tweets: [],
        isLoading: false,
        error: null,
        hasMore: true,
        nextCursor: undefined,
      };
    
    default:
      return state;
  }
}

/**
 * タイムライン機能のカスタムフック
 */
export function useTimeline(params: TimelineParams) {
  const [state, dispatch] = useReducer(timelineReducer, {
    tweets: [],
    isLoading: false,
    error: null,
    hasMore: true,
  });

  // タイムラインを読み込む
  const loadMore = useCallback(async () => {
    if (state.isLoading || !state.hasMore) return;

    dispatch({ type: 'FETCH_START' });

    try {
      const response = await fetchTimeline({
        ...params,
        cursor: state.nextCursor,
      });

      dispatch({
        type: 'FETCH_SUCCESS',
        tweets: response.tweets,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', error: error as Error });
    }
  }, [params, state.isLoading, state.hasMore, state.nextCursor]);

  // いいねの切り替え
  const toggleLike = useCallback(async (tweetId: string) => {
    const tweet = state.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 楽観的更新
    dispatch({ type: 'TOGGLE_LIKE', tweetId });

    try {
      if (tweet.isLiked) {
        await unlikeTweet(tweetId);
      } else {
        await likeTweet(tweetId);
      }
    } catch (error) {
      // エラー時は元に戻す
      dispatch({ type: 'TOGGLE_LIKE', tweetId });
      console.error('Failed to toggle like:', error);
    }
  }, [state.tweets]);

  // リツイートの切り替え
  const toggleRetweet = useCallback(async (tweetId: string) => {
    const tweet = state.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 楽観的更新
    dispatch({ type: 'TOGGLE_RETWEET', tweetId });

    try {
      if (tweet.isRetweeted) {
        // TODO: リポストイベントのIDを保存する必要がある
        await undoRetweet(tweetId);
      } else {
        // 作者のpubkeyを渡す
        await retweet(tweetId, tweet.author.id);
      }
    } catch (error) {
      // エラー時は元に戻す
      dispatch({ type: 'TOGGLE_RETWEET', tweetId });
      console.error('Failed to toggle retweet:', error);
    }
  }, [state.tweets]);

  // タイムラインをリセット
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ツイートを追加（投稿後の更新用）
  const addTweet = useCallback((tweet: Tweet) => {
    dispatch({ type: 'ADD_TWEET', tweet });
  }, []);

  // 初回読み込み・パラメータ変更時のリセット
  useEffect(() => {
    reset();
    loadMore();
  }, [params.type]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tweets: state.tweets,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    toggleLike,
    toggleRetweet,
    reset,
    addTweet,
  };
}