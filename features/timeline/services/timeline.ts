import { TimelineParams, TimelineResponse, Tweet } from '../types';
import { getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';
import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { format } from 'date-fns';
import { fetchFollowList } from '../../follow/services/follow';
import { KIND_TEXT_NOTE, KIND_METADATA, KIND_REACTION } from '../../../lib/nostr/constants';
import { createRepost, deleteRepost } from '../../repost/services/repost';
import { getProfileImageUrl } from '../../../lib/utils/avatar';

// プロフィール情報のキャッシュと取得中のPromiseを管理
const profileCache = new Map<string, any>();
const profileFetchingPromises = new Map<string, Promise<any>>();

// キャッシュの有効期限（5分）
const PROFILE_CACHE_TTL = 5 * 60 * 1000;
const profileCacheTimestamps = new Map<string, number>();


function decodeNoteIdentifier(identifier: string): { id: string; relays?: string[] } | null {
  try {
    if (identifier.startsWith('nevent1') || identifier.startsWith('note1')) {
      const decoded = nip19.decode(identifier);
      if (decoded.type === 'nevent') {
        const data = decoded.data as { id: string; relays?: string[] };
        return { id: data.id, relays: data.relays };
      }
      if (decoded.type === 'note') {
        const id = decoded.data as string;
        return { id };
      }
    }
  } catch (error) {
    console.warn('[timeline] failed to decode identifier', identifier, error);
  }
  if (/^[0-9a-fA-F]{64}$/.test(identifier)) {
    return { id: identifier };
  }
  return null;
}

function extractQuoteReference(tags: string[][]): { id: string; relays?: string[] } | undefined {
  for (const tag of tags) {
    if (tag[0] === 'q' && tag[1]) {
      const decoded = decodeNoteIdentifier(tag[1]);
      if (decoded) return decoded;
    }
  }

  for (const tag of tags) {
    if (tag[0] === 'e' && tag[1]) {
      const marker = tag[3];
      if (marker === 'quote' || marker === 'mention') {
        const relays = tag[2] ? [tag[2]] : undefined;
        return { id: tag[1], relays };
      }
    }
  }

  return undefined;
}

/**
 * Nostrイベントからプロフィール情報を取得（リアルタイム機能削除、静的取得のみ）
 */
async function fetchProfile(pubkey: string, relays: string[]): Promise<any> {
  // キャッシュチェック（有効期限も確認）
  if (profileCache.has(pubkey)) {
    const cachedTime = profileCacheTimestamps.get(pubkey) || 0;
    if (Date.now() - cachedTime < PROFILE_CACHE_TTL) {
      return profileCache.get(pubkey);
    } else {
      // 古いキャッシュを削除
      profileCache.delete(pubkey);
      profileCacheTimestamps.delete(pubkey);
    }
  }

  // すでに取得中の場合は、そのPromiseを返す
  if (profileFetchingPromises.has(pubkey)) {
    return profileFetchingPromises.get(pubkey)!;
  }

  // デフォルトプロフィールを返す（リアルタイム購読を削除）
  const fetchPromise = new Promise<any>((resolve) => {
    const defaultProfile = {
      id: pubkey,
      username: nip19.npubEncode(pubkey).slice(0, 12),
      name: 'Nostr User',
      avatar: getProfileImageUrl(null, pubkey), // 統一されたアバター生成
      bio: '',
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      npub: nip19.npubEncode(pubkey)
    };

    profileCache.set(pubkey, defaultProfile);
    profileCacheTimestamps.set(pubkey, Date.now());
    profileFetchingPromises.delete(pubkey);
    resolve(defaultProfile);
  });

  profileFetchingPromises.set(pubkey, fetchPromise);
  return fetchPromise;
}

/**
 * 複数のイベントのリアクション数を一度に取得（リアルタイム機能削除、デフォルト値のみ）
 */
async function fetchReactionCounts(eventIds: string[], relays: string[]): Promise<Map<string, number>> {
  // リアルタイム機能を削除し、デフォルト値のみ返す
  const counts = new Map<string, number>();
  eventIds.forEach(id => counts.set(id, 0));
  return Promise.resolve(counts);
}

/**
 * NostrイベントをTweet型に変換（リアクション数は後で設定）
 */
async function nostrEventToTweet(event: NostrEvent, relays: string[]): Promise<Tweet> {
  const profile = await fetchProfile(event.pubkey, relays);
  
  const tags = event.tags as string[][];
  const quote = extractQuoteReference(tags);
  
  return {
    id: event.id,
    content: event.content,
    author: profile,
    createdAt: new Date(event.created_at * 1000),
    likesCount: 0, // 一時的に0を設定（後でバッチ処理で更新）
    retweetsCount: 0, // Nostrではリポスト数を別途集計する必要がある
    repliesCount: 0, // Nostrでは返信数を別途集計する必要がある
    zapsCount: 0, // NostrではZap数を別途集計する必要がある
    isLiked: false, // ユーザーの反応状態は別途確認が必要
    isRetweeted: false, // ユーザーのリポスト状態は別途確認が必要
    tags,
    quote,
  };
}

/**
 * タイムラインデータを取得（リアルタイム機能削除、静的なモックデータを返す）
 */
export async function fetchTimeline(params: TimelineParams): Promise<TimelineResponse> {
  try {
    console.log('[fetchTimeline] Real-time features disabled, returning mock data');
    
    // リアルタイム機能を削除し、静的なモックデータを返す
    const mockTweets: Tweet[] = [];
    
    // 簡単なモックデータを生成
    for (let i = 0; i < Math.min(params.limit || 10, 5); i++) {
      const mockPubkey = `mock_pubkey_${i}`;
      const profile = await fetchProfile(mockPubkey, []);
      
      mockTweets.push({
        id: `mock_tweet_${i}`,
        content: `これはモックのツイート ${i + 1} です。リアルタイム機能は無効になっています。`,
        author: profile,
        createdAt: new Date(Date.now() - i * 60000), // i分前
        likesCount: Math.floor(Math.random() * 10),
        retweetsCount: Math.floor(Math.random() * 5),
        repliesCount: Math.floor(Math.random() * 3),
        zapsCount: 0,
        isLiked: false,
        isRetweeted: false,
        tags: [],
      });
    }

    return {
      tweets: mockTweets,
      hasMore: false,
      nextCursor: undefined
    };
    
  } catch (error) {
    console.error('Failed to fetch timeline (mock mode):', error);
    throw error;
  }
}

/**
 * ツイートをいいねする（リアルタイム機能削除、モック処理）
 */
export async function likeTweet(tweetId: string, authorPubkey?: string): Promise<void> {
  console.log('[likeTweet] Mock like operation for tweet:', tweetId);
  // モック処理：実際の処理は行わない
  await new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * いいねを取り消す（リアルタイム機能削除、モック処理）
 */
export async function unlikeTweet(tweetId: string): Promise<void> {
  console.log('[unlikeTweet] Mock unlike operation for tweet:', tweetId);
  // モック処理：実際の処理は行わない
  await new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * ツイートをリツイートする（リアルタイム機能削除、モック処理）
 */
export async function retweet(tweetId: string, authorPubkey?: string): Promise<void> {
  console.log('[retweet] Mock retweet operation for tweet:', tweetId);
  // モック処理：実際の処理は行わない
  await new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * リツイートを取り消す（リアルタイム機能削除、モック処理）
 */
export async function undoRetweet(repostEventId: string): Promise<void> {
  console.log('[undoRetweet] Mock undo retweet operation for:', repostEventId);
  // モック処理：実際の処理は行わない
  await new Promise(resolve => setTimeout(resolve, 200));
}