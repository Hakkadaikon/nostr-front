import { Filter, Event as NostrEvent } from 'nostr-tools';
import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { Tweet, User } from '../../timeline/types';
import { getProfileImageUrl } from '../../../lib/utils/avatar';

/**
 * NIP-50対応の検索フィルタを作成
 */
export function createNip50Filter(query: string, type: 'users' | 'tweets'): Filter[] {
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
    
    default:
      return [{
        ...baseFilter,
        kinds: [0, 1],
      }];
  }
}


/**
 * 投稿の統計情報を取得する
 */
async function getPostStats(eventId: string): Promise<{ likesCount: number; repostsCount: number; repliesCount: number; zapsCount: number }> {
  const relayStore = useRelaysStore.getState();
  const readRelays = relayStore.relays.filter(r => r.read).map(r => r.url);
  
  if (readRelays.length === 0) {
    return { likesCount: 0, repostsCount: 0, repliesCount: 0, zapsCount: 0 };
  }

  let likesCount = 0;
  let repostsCount = 0;
  let repliesCount = 0;
  let zapsCount = 0;

  const filters: Filter[] = [
    // いいね（リアクション）
    {
      kinds: [7],
      '#e': [eventId],
      limit: 100,
    },
    // リポスト
    {
      kinds: [6],
      '#e': [eventId],
      limit: 100,
    },
    // 返信
    {
      kinds: [1],
      '#e': [eventId],
      limit: 100,
    },
    // Zap
    {
      kinds: [9735],
      '#e': [eventId],
      limit: 100,
    },
  ];

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      sub.close();
      resolve({ likesCount, repostsCount, repliesCount, zapsCount });
    }, 2000);

    const sub = subscribe(readRelays, filters, (event: NostrEvent) => {
      switch (event.kind) {
        case 7:
          if (event.content === '+' || event.content === '❤️' || event.content === '👍' || event.content === '♥') {
            likesCount++;
          }
          break;
        case 6:
          repostsCount++;
          break;
        case 1:
          repliesCount++;
          break;
        case 9735:
          zapsCount++;
          break;
      }
    });
  });
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
      avatar: getProfileImageUrl(content.picture, event.pubkey),
      bio: content.about || '',
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(event.created_at * 1000),
      npub,
      nip05: content.nip05,
      website: content.website,
    };
  } catch (e) {
    console.error('Failed to parse user profile:', e);
    return null;
  }
}

/**
 * NostrイベントからTweetに変換
 */
export function eventToTweet(event: NostrEvent, author?: User, stats?: { likesCount: number; repostsCount: number; repliesCount: number; zapsCount: number }): Tweet | null {
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
    likesCount: stats?.likesCount || 0,
    retweetsCount: stats?.repostsCount || 0,
    repliesCount: stats?.repliesCount || 0,
    zapsCount: stats?.zapsCount || 0,
    isLiked: false,
    isRetweeted: false,
  };
}

/**
 * NIP-50対応の検索を実行
 */
export async function searchNostr(
  query: string,
  type: 'users' | 'tweets' = 'users'
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
    const timeout = setTimeout(async () => {
      console.log('[NIP-50 Search] Timeout reached, closing subscription');
      sub.close();
      
      // フォロー数の取得は削除（高速化のため）
      const usersWithStats: User[] = Array.from(userCache.values())
      
      // デバッグ用: ユーザーキャッシュの内容を出力
      console.log('[NIP-50 Search] UserCache size:', userCache.size);
      console.log('[NIP-50 Search] EventCache size:', eventCache.size);
      for (const [pubkey, user] of userCache) {
        const event = eventCache.get(pubkey);
        console.log('[NIP-50 Search] Cached user:', {
          pubkey: pubkey.slice(0, 8) + '...',
          username: user.username,
          name: user.name,
          created_at: event?.created_at || 'unknown',
          id: user.id
        });
      }
      
      // ツイートの統計情報を取得
      const tweetsWithStats: Tweet[] = [];
      for (const tweet of tweets) {
        const stats = await getPostStats(tweet.id);
        const tweetWithStats = {
          ...tweet,
          likesCount: stats.likesCount,
          retweetsCount: stats.repostsCount,
          repliesCount: stats.repliesCount,
          zapsCount: stats.zapsCount,
        };
        tweetsWithStats.push(tweetWithStats);
      }
      
      console.log('[NIP-50 Search] Found unique users:', usersWithStats.length);
      console.log('[NIP-50 Search] Found tweets:', tweetsWithStats.length);
      
      // 重複チェック
      const uniquePubkeys = new Set(usersWithStats.map(u => u.id));
      if (uniquePubkeys.size !== usersWithStats.length) {
        console.error('[NIP-50 Search] DUPLICATE USERS DETECTED!', {
          totalUsers: usersWithStats.length,
          uniquePubkeys: uniquePubkeys.size,
          duplicates: usersWithStats.length - uniquePubkeys.size
        });
        
        // 重複しているユーザーを特定
        const pubkeyCount = new Map<string, number>();
        for (const user of usersWithStats) {
          pubkeyCount.set(user.id, (pubkeyCount.get(user.id) || 0) + 1);
        }
        for (const [pubkey, count] of pubkeyCount) {
          if (count > 1) {
            console.error('[NIP-50 Search] Duplicate pubkey:', pubkey.slice(0, 8) + '...', 'count:', count);
          }
        }
      }
      
      resolve({ users: usersWithStats, tweets: tweetsWithStats });
    }, 5000); // 5秒でタイムアウト

    let eventCount = 0;
    const receivedEventIds = new Set<string>();
    const sub = subscribe(searchRelays, filters, (event: NostrEvent) => {
      eventCount++;
      
      // イベントIDの重複チェック
      if (receivedEventIds.has(event.id || '')) {
        console.warn('[NIP-50 Search] Duplicate event ID received:', event.id);
        return;
      }
      receivedEventIds.add(event.id || '');
      
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
            // 既存のユーザーがいるかチェック
            const existingUser = userCache.get(event.pubkey);
            if (existingUser) {
              console.log('[NIP-50 Search] Updating existing user for pubkey:', event.pubkey.slice(0, 8) + '...', {
                oldUsername: existingUser.username,
                newUsername: user.username,
                oldCreatedAt: existingEvent?.created_at,
                newCreatedAt: event.created_at
              });
            }
            userCache.set(event.pubkey, user);
            eventCache.set(event.pubkey, event);
            console.log('[NIP-50 Search] User updated/added:', user.username, 'created_at:', event.created_at, 'pubkey:', event.pubkey.slice(0, 8) + '...');
          }
        } else {
          console.log('[NIP-50 Search] Skipping older user profile for pubkey:', event.pubkey.slice(0, 8) + '...', {
            existingCreatedAt: existingEvent.created_at,
            newCreatedAt: event.created_at
          });
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
    setTimeout(async () => {
      if (userCache.size === 0 && tweets.length === 0 && eventCount === 0) {
        console.log('[NIP-50 Search] No events received after 1 second');
        clearTimeout(timeout);
        sub.close();
        
        resolve({ users: [], tweets: [] });
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
    const timeout = setTimeout(async () => {
      sub.close();
      
      // フォロー数の取得は削除（高速化のため）
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
