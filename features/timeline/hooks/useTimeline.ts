"use client";

import { useCallback, useEffect, useReducer } from 'react';
import { fetchTimeline, likeTweet, unlikeTweet, retweet, undoRetweet, clearProfileCache } from '../services/timeline';
import { TimelineParams, TimelineState, Tweet, TimelineError } from '../types';
import { useAuthStore } from '../../../stores/auth.store';
import { useTimelineCacheStore } from '../../../stores/timeline-cache.store';
import { toTimestamp } from '../../../lib/utils/date';

// Action types
type TimelineAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; tweets: Tweet[]; nextCursor?: string; hasMore: boolean; error?: TimelineError; isRefresh?: boolean }
  | { type: 'FETCH_ERROR'; error: Error }
  | { type: 'TOGGLE_LIKE'; tweetId: string }
  | { type: 'TOGGLE_RETWEET'; tweetId: string }
  | { type: 'RESET' }
  | { type: 'RESTORE_FROM_CACHE'; tweets: Tweet[]; cursor?: string };

// Reducer
function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'FETCH_START':
      // ローディング中も直前のツイートを保持（空にしない）
      return { ...state, isLoading: true, error: null };

    case 'FETCH_SUCCESS': {
      // IDベースで重複を排除しつつマージ
      const existingIds = new Set(state.tweets.map(t => t.id));
      const newTweets = action.tweets.filter(t => !existingIds.has(t.id));

      // 新しいツイートがない場合は既存の配列をそのまま使う（再レンダリングを防ぐ）
      if (newTweets.length === 0) {
        return {
          ...state,
          nextCursor: action.nextCursor,
          hasMore: action.hasMore,
          isLoading: false,
          error: action.error || null,
        };
      }

      // リフレッシュの場合は新着を先頭に追加、通常のロードは末尾に追加
      const mergedTweets = action.isRefresh
        ? [...newTweets, ...state.tweets]
        : [...state.tweets, ...newTweets];

      // activityTimestamp または createdAt でソート（降順）
      // ソートはマージ時のみ実行し、既存の配列は保持
      const sortedTweets = mergedTweets.sort((a, b) => {
        const aTime = toTimestamp(a.activityTimestamp ?? a.createdAt);
        const bTime = toTimestamp(b.activityTimestamp ?? b.createdAt);
        return bTime - aTime;
      });

      return {
        ...state,
        tweets: sortedTweets,
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        isLoading: false,
        error: action.error || null,
      };
    }

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

    case 'RESTORE_FROM_CACHE':
      return {
        tweets: action.tweets,
        isLoading: false,
        error: null,
        hasMore: true,
        nextCursor: action.cursor,
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

  const timelineCache = useTimelineCacheStore();

  // タイムラインを読み込む（追加ロード）
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
        error: response.error,
        isRefresh: false,
      });

      // キャッシュに保存
      timelineCache.setTimeline(params.type, [...state.tweets, ...response.tweets], response.nextCursor);
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', error: error as Error });

      // エラー時はキャッシュから復元を試みる
      const cached = timelineCache.getTimeline(params.type);
      if (cached && state.tweets.length === 0) {
        dispatch({ type: 'RESTORE_FROM_CACHE', tweets: cached.tweets, cursor: cached.cursor });
      }
    }
  }, [params, state.isLoading, state.hasMore, state.nextCursor, state.tweets, timelineCache]);

  // リフレッシュ（新着取得）
  const refresh = useCallback(async () => {
    if (state.isLoading) return;

    dispatch({ type: 'FETCH_START' });

    try {
      // 最新のツイートを取得（cursorなし）
      // プロフィールキャッシュはTTL（1分）で自然に更新されるため、
      // refresh時に強制クリアするとちらつきの原因になる
      const response = await fetchTimeline({
        ...params,
        cursor: undefined, // 最新から取得
      });

      dispatch({
        type: 'FETCH_SUCCESS',
        tweets: response.tweets,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
        error: response.error,
        isRefresh: true, // リフレッシュフラグ
      });

      // キャッシュを更新
      const existingIds = new Set(state.tweets.map(t => t.id));
      const newTweets = response.tweets.filter(t => !existingIds.has(t.id));
      const mergedTweets = [...newTweets, ...state.tweets];
      timelineCache.setTimeline(params.type, mergedTweets, response.nextCursor);

    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', error: error as Error });
    }
  }, [params, state.isLoading, state.tweets, timelineCache]);

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

    // キャッシュから復元を試みる
    const cached = timelineCache.getTimeline(params.type);
    if (cached && cached.tweets.length > 0) {
      dispatch({ type: 'RESTORE_FROM_CACHE', tweets: cached.tweets, cursor: cached.cursor });
    } else {
      reset();
      loadMore();
    }
  }, [params.type, authPubkey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 外部からのタイムライン更新要求（例: 新規投稿後）
  // リセットではなくリフレッシュを使用（既存投稿を保持）
  useEffect(() => {
    const handler = () => {
      refresh();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('timeline:refresh', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('timeline:refresh', handler);
      }
    };
  }, [refresh]);

  return {
    tweets: state.tweets,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    toggleLike,
    toggleRetweet,
    reset,
    refresh, // リフレッシュ機能を追加
  };
}