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
 * フォロー数を取得する
 */
async function getFollowCounts(pubkey: string): Promise<{ followingCount: number; followersCount: number }> {
  const relayStore = useRelaysStore.getState();
  const readRelays = relayStore.relays.filter(r => r.read).map(r => r.url);
  
  if (readRelays.length === 0) {
    return { followingCount: 0, followersCount: 0 };
  }

  let followingCount = 0;
  let followersCount = 0;

  // フォロー中の数を取得（自分のkind 3イベント）
  const followingFilter: Filter = {
    kinds: [3],
    authors: [pubkey],
    limit: 1,
  };

  // フォロワー数を取得（他の人のkind 3イベントで自分がタグに含まれているもの）
  const followersFilter: Filter = {
    kinds: [3],
    '#p': [pubkey],
    limit: 500,
  };

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      sub.close();
      resolve({ followingCount, followersCount });
    }, 2000);

    const processedAuthors = new Set<string>();

    const sub = subscribe(readRelays, [followingFilter, followersFilter], (event: NostrEvent) => {
      if (event.kind === 3) {
        if (event.pubkey === pubkey) {
          // 自分のフォローリスト
          const pTags = event.tags.filter(tag => tag[0] === 'p');
          followingCount = pTags.length;
        } else {
          // 他の人のフォローリストに自分が含まれている
          if (!processedAuthors.has(event.pubkey)) {
            processedAuthors.add(event.pubkey);
            followersCount++;
          }
        }
      }
    });
  });
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
export function eventToUser(event: NostrEvent, followCounts?: { followingCount: number; followersCount: number }): User | null {
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
      followersCount: followCounts?.followersCount || 0,
      followingCount: followCounts?.followingCount || 0,
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
    const timeout = setTimeout(async () => {
      console.log('[NIP-50 Search] Timeout reached, closing subscription');
      sub.close();
      
      // ユーザーのフォロー数を取得
      const usersWithStats: User[] = [];
      for (const user of userCache.values()) {
        const followCounts = await getFollowCounts(user.id);
        const userWithStats = {
          ...user,
          followingCount: followCounts.followingCount,
          followersCount: followCounts.followersCount,
        };
        usersWithStats.push(userWithStats);
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
      resolve({ users: usersWithStats, tweets: tweetsWithStats });
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
      
      // 各ユーザーのフォロー数を取得
      const usersWithStats = new Map<string, User>();
      for (const [pubkey, user] of userMap) {
        const followCounts = await getFollowCounts(pubkey);
        const userWithStats = {
          ...user,
          followingCount: followCounts.followingCount,
          followersCount: followCounts.followersCount,
        };
        usersWithStats.set(pubkey, userWithStats);
      }
      
      resolve(usersWithStats);
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