import { TimelineParams, TimelineResponse, Tweet } from '../types';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
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
 * Nostrイベントからプロフィール情報を取得
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

  // 新しいPromiseを作成して、取得中のマップに追加
  const fetchPromise = new Promise<any>((resolve) => {
    let profile: any = null;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    let latestEvent: NostrEvent | null = null;
    let latestTimestamp = 0;

    const sub = subscribeTo(
      relays,
      [{ kinds: [KIND_METADATA], authors: [pubkey], limit: 10 }],
      (event: NostrEvent) => {
        if (resolved) return;
        if (event.pubkey !== pubkey) return;

        if (event.created_at > latestTimestamp) {
          latestEvent = event;
          latestTimestamp = event.created_at;
        }
      }
    );

    const processTimeout = setTimeout(() => {
      if (!resolved && latestEvent) {
        try {
          const content = JSON.parse(latestEvent.content);
          profile = {
            id: pubkey,
            username: content.username || content.name || nip19.npubEncode(pubkey).slice(0, 12),
            name: content.display_name || content.name || '',
            avatar: content.picture || getProfileImageUrl(null, pubkey),
            bio: content.about || '',
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date(latestEvent.created_at * 1000),
            npub: nip19.npubEncode(pubkey)
          };
          profileCache.set(pubkey, profile);
          profileCacheTimestamps.set(pubkey, Date.now());
          sub.close();
          resolved = true;
          profileFetchingPromises.delete(pubkey);
          resolve(profile);
        } catch (error) {
          console.error('Failed to parse profile for', pubkey, error);
        }
      }
    }, 1000);

    timeoutId = setTimeout(() => {
      if (!resolved) {
        sub.close();
        clearTimeout(processTimeout);

        if (latestEvent) {
          try {
            const content = JSON.parse(latestEvent.content);
            profile = {
              id: pubkey,
              username: content.username || content.name || nip19.npubEncode(pubkey).slice(0, 12),
              name: content.display_name || content.name || '',
              avatar: content.picture || getProfileImageUrl(null, pubkey),
              bio: content.about || '',
              followersCount: 0,
              followingCount: 0,
              createdAt: new Date(latestEvent.created_at * 1000),
              npub: nip19.npubEncode(pubkey)
            };
          } catch (error) {
            console.error('Failed to parse profile for', pubkey, error);
          }
        }

        if (!profile) {
          profile = {
            id: pubkey,
            username: nip19.npubEncode(pubkey).slice(0, 12),
            name: 'Nostr User',
            avatar: getProfileImageUrl(null, pubkey),
            bio: '',
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date(),
            npub: nip19.npubEncode(pubkey)
          };
        }

        profileCache.set(pubkey, profile);
        profileCacheTimestamps.set(pubkey, Date.now());
        resolved = true;
        profileFetchingPromises.delete(pubkey);
        resolve(profile);
      }
    }, 1500);
  });

  profileFetchingPromises.set(pubkey, fetchPromise);
  return fetchPromise;
}

/**
 * 複数のイベントのリアクション数を一度に取得
 */
async function fetchReactionCounts(eventIds: string[], relays: string[]): Promise<Map<string, number>> {
  return new Promise((resolve) => {
    const counts = new Map<string, number>();
    const seenReactions = new Set<string>();
    let timeoutId: NodeJS.Timeout;

    eventIds.forEach(id => counts.set(id, 0));

    const sub = subscribeTo(
      relays,
      [{ kinds: [KIND_REACTION], '#e': eventIds }],
      (event: NostrEvent) => {
        const targetEventTag = event.tags.find(tag => tag[0] === 'e');
        if (!targetEventTag || !targetEventTag[1]) return;

        const targetEventId = targetEventTag[1];

        if (!seenReactions.has(event.id) && event.content === '+' && counts.has(targetEventId)) {
          seenReactions.add(event.id);
          counts.set(targetEventId, (counts.get(targetEventId) || 0) + 1);
        }
      }
    );

    timeoutId = setTimeout(() => {
      sub.close();
      resolve(counts);
    }, 1000);
  });
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
 * タイムラインデータを取得
 */
export async function fetchTimeline(params: TimelineParams): Promise<TimelineResponse> {
  try {
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

    const limit = params.limit || 10;
    const until = params.cursor ? parseInt(params.cursor) : Math.floor(Date.now() / 1000);

    let followingList: string[] = [];
    if (params.type === 'following') {
      console.log('[fetchTimeline] Fetching follow list for following tab');
      followingList = await fetchFollowList();
      console.log('[fetchTimeline] Follow list retrieved:', followingList.length, 'pubkeys');

      // 自分自身の投稿もFollowingタイムラインに含める（一般的なクライアント挙動）
      const selfPubkey = useAuthStore.getState().publicKey;
      if (selfPubkey && !followingList.includes(selfPubkey)) {
        followingList.push(selfPubkey);
        console.log('[fetchTimeline] Added self pubkey to follow list');
      }

      if (followingList.length === 0) {
        console.log('[fetchTimeline] Follow list is empty (even after adding self), returning empty timeline');
        return {
          tweets: [],
          hasMore: false
        };
      }
    }

    const events: NostrEvent[] = [];
    const tweets: Tweet[] = [];

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;

      const filters: any = {
        kinds: [KIND_TEXT_NOTE],
        limit: Math.min(limit * 2, 50),
        until: until
      };

      if (params.type === 'following' && followingList.length > 0) {
        filters.authors = followingList;
        console.log('[fetchTimeline] Setting authors filter for following tab:', filters.authors.length, 'authors');
      }

      const sub = subscribeTo(
        relays,
        [filters],
        async (event: NostrEvent) => {
          if (!events.find(e => e.id === event.id)) {
            events.push(event);
            nostrEventToTweet(event, relays).then(tweet => {
              tweets.push(tweet);

              if (tweets.length >= limit) {
                clearTimeout(timeoutId);
                sub.close();
                processAndResolve();
              }
            }).catch(error => {
              console.error('[fetchTimeline] Failed to convert event to tweet:', error);
            });
          }
        }
      );

      const processAndResolve = async () => {
        if (tweets.length > 0) {
          const eventIds = tweets.map(t => t.id);
          const reactionCounts = await fetchReactionCounts(eventIds, relays);

          tweets.forEach(tweet => {
            tweet.likesCount = reactionCounts.get(tweet.id) || 0;
          });
        }

        tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const oldestEvent = events.length > 0
          ? events.reduce((oldest, event) =>
              event.created_at < oldest.created_at ? event : oldest
            )
          : null;

        resolve({
          tweets: tweets.slice(0, limit),
          nextCursor: oldestEvent ? oldestEvent.created_at.toString() : undefined,
          hasMore: tweets.length >= limit
        });
      };

      timeoutId = setTimeout(async () => {
        sub.close();
        await processAndResolve();
      }, 4000);
    });
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
    throw error;
  }
}

/**
 * ツイートをいいねする（Nostrでは反応イベントを送信）
 */
export async function likeTweet(tweetId: string, authorPubkey?: string): Promise<void> {
  try {
    const authStore = useAuthStore.getState();
    if (!authStore.publicKey && !authStore.npub) {
      console.warn('Cannot like: User is not authenticated');
      throw new Error('Authentication required to like posts');
    }

    const relaysStore = useRelaysStore.getState();
    let relays = relaysStore.relays.filter(r => r.write).map(r => r.url);

    if (relays.length === 0) {
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
      }
    }

    const tags: string[][] = [['e', tweetId]];
    if (authorPubkey) {
      tags.push(['p', authorPubkey]);
    }

    const unsignedEvent = {
      kind: KIND_REACTION,
      content: '+',
      tags,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: '',
    };

    if (window.nostr) {
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      const { publish } = await import('../../../lib/nostr/client');
      await publish(relays, signedEvent as NostrEvent);
      console.log('Successfully liked tweet:', tweetId);
    } else {
      throw new Error('Nostr extension not found');
    }
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
    const authStore = useAuthStore.getState();
    if (!authStore.publicKey && !authStore.npub) {
      console.warn('Cannot unlike: User is not authenticated');
      throw new Error('Authentication required to unlike posts');
    }

    console.log('Unlike tweet (not implemented):', tweetId);
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
    const authStore = useAuthStore.getState();
    if (!authStore.publicKey && !authStore.npub) {
      console.warn('Cannot retweet: User is not authenticated');
      throw new Error('Authentication required to retweet posts');
    }

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
 */
export async function undoRetweet(repostEventId: string): Promise<void> {
  try {
    const authStore = useAuthStore.getState();
    if (!authStore.publicKey && !authStore.npub) {
      console.warn('Cannot undo retweet: User is not authenticated');
      throw new Error('Authentication required to undo retweet');
    }

    await deleteRepost(repostEventId);
  } catch (error) {
    console.error('Failed to undo retweet:', error);
    throw error;
  }
}