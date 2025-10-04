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
    // リアクション
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
  const startTime = Date.now();
  const relayStore = useRelaysStore.getState();
  const searchRelays = relayStore.getSearchRelays();

  console.log('[NIP-50 Search] Starting search', { query, type, searchRelays });

  if (searchRelays.length === 0) {
    throw new Error('検索用のNIP-50対応リレーが設定されていません。設定ページで検索リレーを指定してください。');
  }

  const filters = createNip50Filter(query, type);

  const tweets: Tweet[] = [];
  const userCache = new Map<string, User>();
  const eventCache = new Map<string, NostrEvent>();
  const tweetPubkeys = new Set<string>();

  return new Promise((resolve) => {
    let eoseReceived = false;
    let timeout: NodeJS.Timeout;

    const finalize = async () => {
      sub.close();
      clearTimeout(timeout);

      const usersArray = Array.from(userCache.values());

      // ツイート検索時にプロフィール未取得のauthorを補完
      if (type === 'tweets' && tweetPubkeys.size > 0) {
        const missingPubkeys = Array.from(tweetPubkeys).filter(pk => !userCache.has(pk));
        if (missingPubkeys.length > 0) {
          console.log('[NIP-50 Search] Fetching missing profiles', { count: missingPubkeys.length });
          const profiles = await fetchUserProfiles(missingPubkeys);
          profiles.forEach((user, pubkey) => userCache.set(pubkey, user));

          // ツイートのauthorを更新
          tweets.forEach(tweet => {
            if (!tweet.author.name && userCache.has(tweet.author.id)) {
              tweet.author = userCache.get(tweet.author.id)!;
            }
          });
        }
      }

      // ツイートの統計情報を並列取得
      const tweetsWithStats = await Promise.all(
        tweets.map(async (tweet) => {
          const stats = await getPostStats(tweet.id);
          return {
            ...tweet,
            likesCount: stats.likesCount,
            retweetsCount: stats.repostsCount,
            repliesCount: stats.repliesCount,
            zapsCount: stats.zapsCount,
          };
        })
      );

      const duration = Date.now() - startTime;
      console.log('[NIP-50 Search] Search completed', {
        query,
        type,
        users: usersArray.length,
        tweets: tweetsWithStats.length,
        totalEvents: eventCount,
        kind0Events: kind0Count,
        kind1Events: kind1Count,
        duration: `${duration}ms`,
        eoseReceived
      });

      resolve({ users: usersArray, tweets: tweetsWithStats });
    };

    // EOSEハンドラ: イベント取得完了
    const handleEose = () => {
      if (!eoseReceived) {
        eoseReceived = true;
        console.log('[NIP-50 Search] EOSE received');
        finalize();
      }
    };

    // タイムアウト: 5秒経過しても完了しない場合
    timeout = setTimeout(() => {
      if (!eoseReceived) {
        console.warn('[NIP-50 Search] Timeout reached (5s)');
        finalize();
      }
    }, 5000);

    let eventCount = 0;
    let kind0Count = 0;
    let kind1Count = 0;
    const receivedEventIds = new Set<string>();
    const sub = subscribe(
      searchRelays,
      filters,
      (event: NostrEvent) => {
        eventCount++;

        // イベントIDの重複チェック
        if (receivedEventIds.has(event.id || '')) {
          console.warn('[NIP-50 Search] Duplicate event ID received:', event.id);
          return;
        }
        receivedEventIds.add(event.id || '');

        if (event.kind === 0) {
          // ユーザープロフィール
          kind0Count++;
          const existingEvent = eventCache.get(event.pubkey);

          if (!existingEvent || event.created_at > existingEvent.created_at) {
            const user = eventToUser(event);
            if (user) {
              userCache.set(event.pubkey, user);
              eventCache.set(event.pubkey, event);
            }
          }
        } else if (event.kind === 1) {
          // テキストノート
          kind1Count++;
          console.log('[NIP-50 Search] Received kind:1 event', {
            id: event.id?.slice(0, 8),
            content: event.content.slice(0, 50),
            pubkey: event.pubkey.slice(0, 8)
          });
          tweetPubkeys.add(event.pubkey);
          const author = userCache.get(event.pubkey);
          const tweet = eventToTweet(event, author);
          if (tweet) {
            tweets.push(tweet);
          }
        } else {
          console.warn('[NIP-50 Search] Unexpected event kind:', event.kind);
        }
      },
      handleEose
    );

    // 早期終了チェック: 1秒経過してもイベントが0件の場合
    setTimeout(() => {
      if (userCache.size === 0 && tweets.length === 0 && eventCount === 0) {
        console.log('[NIP-50 Search] No events received after 1s, closing');
        finalize();
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
        }
      } else {
      }
    });
  });
}
