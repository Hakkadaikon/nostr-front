import { TimelineParams, TimelineResponse, Tweet } from '../types';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { format } from 'date-fns';
import { fetchFollowList } from '../../follow/services/follow';
import { KIND_TEXT_NOTE, KIND_METADATA } from '../../../lib/nostr/constants';
import { createRepost, deleteRepost } from '../../repost/services/repost';

// プロフィール情報のキャッシュ
const profileCache = new Map<string, any>();


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
 * Nostrイベントからプロフィール情報を取得
 */
async function fetchProfile(pubkey: string, relays: string[]): Promise<any> {
  // キャッシュチェック
  if (profileCache.has(pubkey)) {
    return profileCache.get(pubkey);
  }

  return new Promise((resolve) => {
    let profile: any = null;
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      relays,
      [{ kinds: [KIND_METADATA], authors: [pubkey], limit: 1 }],
      (event: NostrEvent) => {
        try {
          const content = JSON.parse(event.content);
          profile = {
            id: pubkey,
            username: content.username || content.name || nip19.npubEncode(pubkey).slice(0, 12),
            name: content.display_name || content.name || '',
            avatar: content.picture || `https://robohash.org/${pubkey}`,
            bio: content.about || '',
            followersCount: 0, // Nostrでは直接取得できないため
            followingCount: 0, // Nostrでは直接取得できないため
            createdAt: new Date(event.created_at * 1000)
          };
          profileCache.set(pubkey, profile);
          clearTimeout(timeoutId);
          sub.close();
          resolve(profile);
        } catch (error) {
          console.error('Failed to parse profile:', error);
        }
      }
    );

    // タイムアウト設定（1秒に短縮）
    timeoutId = setTimeout(() => {
      sub.close();
      // デフォルトプロフィールを返す
      const defaultProfile = {
        id: pubkey,
        username: nip19.npubEncode(pubkey).slice(0, 12),
        name: 'Nostr User',
        avatar: `https://robohash.org/${pubkey}`,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date()
      };
      profileCache.set(pubkey, defaultProfile);
      resolve(defaultProfile);
    }, 1500);
  });
}

/**
 * NostrイベントをTweet型に変換
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
    likesCount: 0, // Nostrでは反応数を別途集計する必要がある
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
 * タイムラインデータを取得
 */
export async function fetchTimeline(params: TimelineParams): Promise<TimelineResponse> {
  try {
    // リレー設定を取得（読み取り可能なリレー + 既知のフォールバックリレーを統合）
    const relaysStore = useRelaysStore.getState();
    const configuredRelays = getReadRelays(relaysStore.relays);

    const envRelays = (process.env.NEXT_PUBLIC_DEFAULT_RELAYS || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);

    const fallbackRelays = envRelays.length > 0 ? envRelays : [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band'
    ];

    const relays = Array.from(new Set([...(configuredRelays || []), ...fallbackRelays]));

    const limit = params.limit || 10; // デフォルトを20から10に削減
    const until = params.cursor ? parseInt(params.cursor) : Math.floor(Date.now() / 1000);

    // フォロー中タブの場合、フォローリストを取得
    let followingList: string[] = [];
    if (params.type === 'following') {
      console.log('[fetchTimeline] Fetching follow list for following tab');
      followingList = await fetchFollowList();
      console.log('[fetchTimeline] Follow list retrieved:', followingList.length, 'pubkeys');
      
      if (followingList.length === 0) {
        console.log('[fetchTimeline] Follow list is empty, returning empty timeline');
        // フォローリストが空の場合は空のタイムラインを返す
        return {
          tweets: [],
          hasMore: false
        };
      }
    }

    // Nostrイベントを収集
    const events: NostrEvent[] = [];
    const tweets: Tweet[] = [];

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;

      // フィルター設定
      const filters: any = {
        kinds: [KIND_TEXT_NOTE],
        limit: Math.min(limit * 1.5, 30), // 過剰な取得を防ぐため上限を設定
        until: until
      };

      // フォロー中タブの場合は、フォローしている人のみを取得
      if (params.type === 'following' && followingList.length > 0) {
        filters.authors = followingList;
        console.log('[fetchTimeline] Setting authors filter for following tab:', filters.authors.length, 'authors');
      }

      const sub = subscribeTo(
        relays,
        [filters],
        async (event: NostrEvent) => {
          // 重複チェック
          if (!events.find(e => e.id === event.id)) {
            events.push(event);
            const tweet = await nostrEventToTweet(event, relays);
            tweets.push(tweet);
          }

          // 必要数に達したら完了
          if (tweets.length >= limit) {
            clearTimeout(timeoutId);
            sub.close();
            
            // 時系列でソート（新しい順）
            tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            const oldestEvent = events.reduce((oldest, event) => 
              event.created_at < oldest.created_at ? event : oldest
            );
            
            resolve({
              tweets: tweets.slice(0, limit),
              nextCursor: oldestEvent.created_at.toString(),
              hasMore: true // Nostrは常に過去のイベントを取得可能
            });
          }
        }
      );

      // タイムアウト設定（2秒に短縮）
      timeoutId = setTimeout(() => {
        sub.close();
        
        // 時系列でソート（新しい順）
        tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        const oldestEvent = events.length > 0 
          ? events.reduce((oldest, event) => 
              event.created_at < oldest.created_at ? event : oldest
            )
          : null;
        
        resolve({
          tweets: tweets.slice(0, limit),
          nextCursor: oldestEvent ? oldestEvent.created_at.toString() : undefined,
          hasMore: tweets.length === limit
        });
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
    throw error;
  }
}

/**
 * ツイートをいいねする（Nostrでは反応イベントを送信）
 */
export async function likeTweet(tweetId: string): Promise<void> {
  try {
    // TODO: Nostrの反応イベント（Kind 7）を実装
    console.log('Like tweet:', tweetId);
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error('Failed to like tweet:', error);
    throw error;
  }
}

/**
 * いいねを取り消す（Nostrでは削除イベントを送信）
 */
export async function unlikeTweet(tweetId: string): Promise<void> {
  try {
    // TODO: Nostrの削除イベント（Kind 5）を実装
    console.log('Unlike tweet:', tweetId);
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error('Failed to unlike tweet:', error);
    throw error;
  }
}

/**
 * ツイートをリツイートする（Nostrではリポストイベントを送信）
 */
export async function retweet(tweetId: string, authorPubkey?: string): Promise<void> {
  try {
    // 作者の公開鍵が提供されていない場合は、イベントから取得する必要がある
    // 簡略化のため、ここでは必須パラメータとする
    if (!authorPubkey) {
      throw new Error('Author pubkey is required for repost');
    }
    
    await createRepost(tweetId, authorPubkey);
  } catch (error) {
    console.error('Failed to retweet:', error);
    throw error;
  }
}

/**
 * リツイートを取り消す（Nostrでは削除イベントを送信）
 * 注意: 実際にリポストイベントのIDが必要
 */
export async function undoRetweet(repostEventId: string): Promise<void> {
  try {
    await deleteRepost(repostEventId);
  } catch (error) {
    console.error('Failed to undo retweet:', error);
    throw error;
  }
}