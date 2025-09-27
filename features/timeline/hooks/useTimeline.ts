"use client";

import { useCallback, useEffect, useReducer } from 'react';
import { fetchTimeline, likeTweet, unlikeTweet, retweet, undoRetweet } from '../services/timeline';
import { TimelineParams, TimelineState, Tweet } from '../types';
import { useAuthStore } from '../../../stores/auth.store';

// Action types
type TimelineAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; tweets: Tweet[]; nextCursor?: string; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: Error }
  | { type: 'TOGGLE_LIKE'; tweetId: string }
  | { type: 'TOGGLE_RETWEET'; tweetId: string }
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

    // 認証チェック
    const authStore = useAuthStore.getState();
    if (!authStore.publicKey && !authStore.npub) {
      console.warn('Cannot like: User is not authenticated');
      alert('いいねするにはログインが必要です');
      return;
    }

    // 楽観的更新
    dispatch({ type: 'TOGGLE_LIKE', tweetId });

    try {
      if (tweet.isLiked) {
        await unlikeTweet(tweetId);
      } else {
        // author.idはpubkeyなのでそのまま渡す
        await likeTweet(tweetId, tweet.author.id);
      }
    } catch (error) {
      // エラー時は元に戻す
      dispatch({ type: 'TOGGLE_LIKE', tweetId });
      console.error('Failed to toggle like:', error);
      alert('いいね操作に失敗しました。もう一度お試しください。');
    }
  }, [state.tweets]);

  // リツイートの切り替え
  const toggleRetweet = useCallback(async (tweetId: string) => {
    const tweet = state.tweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 認証チェック
    const authStore = useAuthStore.getState();
    if (!authStore.publicKey && !authStore.npub) {
      console.warn('Cannot retweet: User is not authenticated');
      alert('リツイートするにはログインが必要です');
      return;
    }

    // 楽観的更新
    dispatch({ type: 'TOGGLE_RETWEET', tweetId });

    try {
      if (tweet.isRetweeted) {
        // TODO: リポストイベントのIDを保存する必要がある
        await undoRetweet(tweetId);
      } else {
        // 作者のpubkeyを渡す（author.idはpubkey）
        await retweet(tweetId, tweet.author.id);
      }
    } catch (error) {
      // エラー時は元に戻す
      dispatch({ type: 'TOGGLE_RETWEET', tweetId });
      console.error('Failed to toggle retweet:', error);
      alert('リツイート操作に失敗しました。もう一度お試しください。');
    }
  }, [state.tweets]);

  // タイムラインをリセット
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // 現在のユーザーの公開鍵（NIP-07などで取得）
  const authPubkey = useAuthStore(state => state.publicKey);

  // 初回読み込み・パラメータ変更時、または公開鍵取得時のリセット
  useEffect(() => {
    // フォロー中タブは公開鍵が必要（kind3でフォローリストを取得するため）
    if (params.type === 'following' && !authPubkey) return;
    reset();
    loadMore();
  }, [params.type, authPubkey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tweets: state.tweets,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    toggleLike,
    toggleRetweet,
    reset,
  };
}