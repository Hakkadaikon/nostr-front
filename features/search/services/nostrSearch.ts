import { Filter, Event as NostrEvent } from 'nostr-tools';
import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { Tweet, User } from '../../timeline/types';

/**
 * NIP-50対応の検索フィルタを作成
 */
export function createNip50Filter(query: string, type: 'all' | 'users' | 'tweets'): Filter[] {
  const baseFilter: Filter = {
    search: query,
    limit: 50,
  };

  switch (type) {
    case 'users':
      // プロフィール情報の検索（kind: 0）
      return [{
        ...baseFilter,
        kinds: [0],
      }];
    
    case 'tweets':
      // テキストノートの検索（kind: 1）
      return [{
        ...baseFilter,
        kinds: [1],
      }];
    
    case 'all':
    default:
      // プロフィールとテキストノートの両方を検索
      return [
        {
          ...baseFilter,
          kinds: [0, 1],
        }
      ];
  }
}

/**
 * NostrイベントからUserに変換
 */
export function eventToUser(event: NostrEvent): User | null {
  if (event.kind !== 0) return null;

  try {
    const { nip19 } = require('nostr-tools');
    const content = JSON.parse(event.content);
    const npub = nip19.npubEncode(event.pubkey);
    
    return {
      id: event.pubkey,
      username: content.username || content.name || 'nostr:' + event.pubkey.slice(0, 8),
      name: content.display_name || content.name || '',
      avatar: content.picture || undefined,
      bio: content.about || '',
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(event.created_at * 1000),
      npub,
    };
  } catch (e) {
    console.error('Failed to parse user profile:', e);
    return null;
  }
}

/**
 * NostrイベントからTweetに変換
 */
export function eventToTweet(event: NostrEvent, author?: User): Tweet | null {
  if (event.kind !== 1) return null;

  return {
    id: event.id || '',
    content: event.content,
    author: author || {
      id: event.pubkey,
      username: 'nostr:' + event.pubkey.slice(0, 8),
      name: '',
      avatar: '',
      bio: '',
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
    },
    createdAt: new Date(event.created_at * 1000),
    likesCount: 0,
    retweetsCount: 0,
    repliesCount: 0,
    zapsCount: 0,
    isLiked: false,
    isRetweeted: false,
  };
}

/**
 * NIP-50対応の検索を実行
 */
export async function searchNostr(
  query: string,
  type: 'all' | 'users' | 'tweets' = 'all'
): Promise<{ users: User[], tweets: Tweet[] }> {
  const relayStore = useRelaysStore.getState();
  const searchRelays = relayStore.getSearchRelays();

  console.log('[NIP-50 Search] Query:', query);
  console.log('[NIP-50 Search] Type:', type);
  console.log('[NIP-50 Search] Search relays:', searchRelays);

  if (searchRelays.length === 0) {
    throw new Error('検索用のNIP-50対応リレーが設定されていません。設定ページで検索リレーを指定してください。');
  }

  const filters = createNip50Filter(query, type);
  console.log('[NIP-50 Search] Filters:', JSON.stringify(filters, null, 2));
  
  const tweets: Tweet[] = [];
  const userCache = new Map<string, User>();
  const eventCache = new Map<string, NostrEvent>();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('[NIP-50 Search] Timeout reached, closing subscription');
      
      // userCacheからユニークなユーザーの配列を作成
      const users = Array.from(userCache.values());
      
      console.log('[NIP-50 Search] Found unique users:', users.length);
      console.log('[NIP-50 Search] Found tweets:', tweets.length);
      sub.close();
      resolve({ users, tweets });
    }, 5000); // 5秒でタイムアウト

    let eventCount = 0;
    const sub = subscribe(searchRelays, filters, (event: NostrEvent) => {
      eventCount++;
      console.log(`[NIP-50 Search] Event #${eventCount} received:`, {
        id: event.id,
        kind: event.kind,
        content: event.content.slice(0, 100) + '...',
        pubkey: event.pubkey,
        created_at: event.created_at
      });

      if (event.kind === 0) {
        // ユーザープロフィール
        const existingEvent = eventCache.get(event.pubkey);
        
        // 既存のイベントがない、または新しいイベントのタイムスタンプが新しい場合のみ処理
        if (!existingEvent || event.created_at > existingEvent.created_at) {
          const user = eventToUser(event);
          if (user) {
            userCache.set(event.pubkey, user);
            eventCache.set(event.pubkey, event);
            console.log('[NIP-50 Search] User updated/added:', user.username, 'created_at:', event.created_at);
          }
        } else {
          console.log('[NIP-50 Search] Skipping older user profile for pubkey:', event.pubkey);
        }
      } else if (event.kind === 1) {
        // テキストノート
        const author = userCache.get(event.pubkey);
        const tweet = eventToTweet(event, author);
        if (tweet) {
          tweets.push(tweet);
          console.log('[NIP-50 Search] Tweet found:', tweet.content.slice(0, 50) + '...');
        }
      }
    });

    // エラーハンドリング
    setTimeout(() => {
      if (userCache.size === 0 && tweets.length === 0 && eventCount === 0) {
        console.log('[NIP-50 Search] No events received after 1 second');
        clearTimeout(timeout);
        sub.close();
        
        // userCacheからユニークなユーザーの配列を作成
        const users = Array.from(userCache.values());
        resolve({ users, tweets });
      }
    }, 1000);
  });
}

/**
 * ユーザーのプロフィール情報を取得
 */
export async function fetchUserProfiles(pubkeys: string[]): Promise<Map<string, User>> {
  const relayStore = useRelaysStore.getState();
  const readRelays = relayStore.relays.filter(r => r.read).map(r => r.url);
  
  if (readRelays.length === 0) {
    return new Map();
  }

  const userMap = new Map<string, User>();
  const eventCache = new Map<string, NostrEvent>();
  const filter: Filter = {
    kinds: [0],
    authors: pubkeys,
  };

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      sub.close();
      resolve(userMap);
    }, 3000);

    const sub = subscribe(readRelays, [filter], (event: NostrEvent) => {
      const existingEvent = eventCache.get(event.pubkey);
      
      // 既存のイベントがない、または新しいイベントのタイムスタンプが新しい場合のみ処理
      if (!existingEvent || event.created_at > existingEvent.created_at) {
        const user = eventToUser(event);
        if (user) {
          userMap.set(event.pubkey, user);
          eventCache.set(event.pubkey, event);
          console.log('[fetchUserProfiles] User profile updated for:', event.pubkey, 'created_at:', event.created_at);
        }
      } else {
        console.log('[fetchUserProfiles] Skipping older profile for pubkey:', event.pubkey);
      }
    });
  });
}