import { TimelineParams, TimelineResponse, Tweet } from '../types';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';
import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { format } from 'date-fns';
import { fetchFollowList } from '../../follow/services/follow';
import { KIND_TEXT_NOTE, KIND_METADATA, KIND_REACTION, KIND_REPOST, KIND_ZAP_RECEIPT, KIND_ZAP_REQUEST } from '../../../lib/nostr/constants';
import { createRepost, deleteRepost } from '../../repost/services/repost';
import { getProfileImageUrl } from '../../../lib/utils/avatar';
import { extractReplyTo } from '../../../lib/nostr/nip10';

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
            pubkey,
            username: content.username || content.name || nip19.npubEncode(pubkey).slice(0, 12),
            name: content.display_name || content.name || '',
            avatar: getProfileImageUrl(content.picture, pubkey),
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
              avatar: getProfileImageUrl(content.picture, pubkey),
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
            pubkey,
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

async function fetchEventById(eventId: string, relays: string[]): Promise<NostrEvent | null> {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    const sub = subscribeTo(
      relays,
      [{ ids: [eventId], limit: 1 }],
      (event: NostrEvent) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        sub.close();
        resolve(event);
      }
    );

    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        sub.close();
        resolve(null);
      }
    }, 2000);
  });
}

/**
 * NostrイベントをTweet型に変換（リアクション数は後で設定）
 */
async function nostrEventToTweet(event: NostrEvent, relays: string[]): Promise<Tweet> {
  const profile = await fetchProfile(event.pubkey, relays);

  const tags = event.tags as string[][];
  const quote = extractQuoteReference(tags);
  const parentId = extractReplyTo(tags);

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
     parentId,
    tags,
    quote,
  };
}

/**
 * タイムラインデータを取得
 * フォロータイムラインは二段階ロード対応：
 * 1. キャッシュ済みフォロー集合で即時購読
 * 2. バックグラウンドで最新フォローリストを取得（次回用にキャッシュ更新）
 */
export async function fetchTimeline(params: TimelineParams): Promise<TimelineResponse> {
  const startTime = Date.now();

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
      const followFetchStart = Date.now();
      console.log('[fetchTimeline] Fetching follow list for following tab');

      // フォローリスト取得（キャッシュ優先）
      followingList = await fetchFollowList();
      const followFetchElapsed = Date.now() - followFetchStart;

      console.log(`[fetchTimeline] Follow list retrieved: ${followingList.length} pubkeys in ${followFetchElapsed}ms`);

      // 自分自身の投稿もFollowingタイムラインに含める（一般的なクライアント挙動）
      const selfPubkey = useAuthStore.getState().publicKey;
      if (selfPubkey && !followingList.includes(selfPubkey)) {
        followingList.push(selfPubkey);
        console.log('[fetchTimeline] Added self pubkey to follow list');
      }

      if (followingList.length === 0) {
        console.log('[fetchTimeline] Follow list is empty (even after adding self), returning empty timeline with guidance');
        return {
          tweets: [],
          hasMore: false,
          error: {
            code: 'EMPTY_FOLLOW_LIST',
            message: 'フォロー中のユーザーがいません。他のユーザーをフォローしてタイムラインを表示しましょう。',
          }
        };
      }
    }

    const events: NostrEvent[] = [];
    const timelineTweets: Tweet[] = [];
    const seenKeys = new Set<string>();
    const eventCache = new Map<string, NostrEvent>();

    const includeActivities = params.type === 'following';

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;

      const kinds = includeActivities
        ? [KIND_TEXT_NOTE, KIND_REPOST, KIND_REACTION, KIND_ZAP_RECEIPT]
        : [KIND_TEXT_NOTE, KIND_REPOST];

      const filters: any = {
        kinds,
        limit: Math.min(limit * (includeActivities ? 4 : 2), 100),
        until,
      };

      if (params.type === 'following' && followingList.length > 0) {
        filters.authors = followingList;
        console.log('[fetchTimeline] Setting authors filter for following tab:', filters.authors.length, 'authors');
      }

      const getCachedEvent = async (eventId: string): Promise<NostrEvent | null> => {
        if (eventCache.has(eventId)) {
          return eventCache.get(eventId)!;
        }
        const fetched = await fetchEventById(eventId, relays);
        if (fetched) {
          eventCache.set(eventId, fetched);
        }
        return fetched;
      };

      const pushTweet = (originEvent: NostrEvent, tweet: Tweet) => {
        const key = tweet.activity?.sourceEventId ?? originEvent.id;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        if (!tweet.author.pubkey) {
          tweet.author.pubkey = tweet.author.id;
        }

        if (tweet.activity) {
          tweet.activity.sourceEventId = tweet.activity.sourceEventId || originEvent.id;
          tweet.activity.targetNoteId = tweet.activity.targetNoteId || tweet.id;
        }

        tweet.activityTimestamp = tweet.activityTimestamp ?? new Date(originEvent.created_at * 1000);

        timelineTweets.push(tweet);
        events.push(originEvent);

        if (timelineTweets.length >= limit) {
          clearTimeout(timeoutId);
          setTimeout(() => {
            sub.close();
            finalize();
          }, 200);
        }
      };

      const buildNoteActivity = (event: NostrEvent, tweet: Tweet) => {
        const isReply = event.tags?.some(tag => tag[0] === 'e' && tag[3] === 'reply');
        if (isReply) {
          tweet.activity = {
            type: 'reply',
            actor: { ...tweet.author },
            sourceEventId: event.id,
            targetNoteId: tweet.id,
          };
        }
        tweet.activityTimestamp = new Date(event.created_at * 1000);
      };

      const processNoteEvent = async (event: NostrEvent) => {
        const tweet = await nostrEventToTweet(event, relays);
        if (includeActivities) {
          buildNoteActivity(event, tweet);
        }
        pushTweet(event, tweet);
      };

      const processRepostEvent = async (event: NostrEvent) => {
        const targetNoteId = event.tags.find(tag => tag[0] === 'e' && tag[1])?.[1];
        if (!targetNoteId) return;
        const originalEvent = await getCachedEvent(targetNoteId);
        if (!originalEvent) return;

        const baseTweet = await nostrEventToTweet(originalEvent, relays);
        const actorProfile = await fetchProfile(event.pubkey, relays);

        baseTweet.activity = {
          type: 'repost',
          actor: actorProfile,
          sourceEventId: event.id,
          targetNoteId,
        };
        baseTweet.activityTimestamp = new Date(event.created_at * 1000);
        pushTweet(event, baseTweet);
      };

      const processReactionEvent = async (event: NostrEvent) => {
        const targetNoteId = event.tags.find(tag => tag[0] === 'e' && tag[1])?.[1];
        if (!targetNoteId) return;
        const originalEvent = await getCachedEvent(targetNoteId);
        if (!originalEvent) return;

        const baseTweet = await nostrEventToTweet(originalEvent, relays);
        const actorProfile = await fetchProfile(event.pubkey, relays);

        const content = (event.content || '').trim();
        const emojiReaction = content && content !== '+' && content !== '❤️' && content !== '♥';

        baseTweet.activity = {
          type: emojiReaction ? 'emoji' : 'like',
          actor: actorProfile,
          sourceEventId: event.id,
          targetNoteId,
          emoji: emojiReaction ? content.slice(0, 8) : undefined,
        };
        baseTweet.activityTimestamp = new Date(event.created_at * 1000);
        pushTweet(event, baseTweet);
      };

      const parseBolt11AmountToSats = (invoice: string): number | null => {
        const match = invoice.match(/lnbc(\d+)([munp]?)/i);
        if (!match) return null;
        const raw = parseInt(match[1]);
        if (isNaN(raw)) return null;
        const unit = match[2] || '';
        const multipliers: Record<string, number> = {
          '': 100_000_000,
          m: 100_000,
          u: 100,
          n: 0.1,
          p: 0.0001,
        };
        const sats = raw * (multipliers[unit] ?? 100_000_000);
        return Math.floor(sats);
      };

      const processZapEvent = async (event: NostrEvent) => {
        const descriptionTag = event.tags.find(tag => tag[0] === 'description');
        if (!descriptionTag || !descriptionTag[1]) return;

        let zapRequestEvent: any;
        try {
          zapRequestEvent = JSON.parse(descriptionTag[1]);
        } catch (error) {
          console.warn('[fetchTimeline] invalid zap description JSON');
          return;
        }

        if (zapRequestEvent.kind !== KIND_ZAP_REQUEST) {
          // 期待するzapリクエストではない
          return;
        }

        const requestTags: string[][] = Array.isArray(zapRequestEvent.tags) ? zapRequestEvent.tags : [];
        const targetNoteId = requestTags.find(tag => tag[0] === 'e' && tag[1])?.[1];
        const zapMessage: string | undefined = typeof zapRequestEvent.content === 'string' && zapRequestEvent.content.length > 0
          ? zapRequestEvent.content
          : undefined;

        let amountSats: number | null = null;
        const bolt11Tag = event.tags.find(tag => tag[0] === 'bolt11' && tag[1]);
        if (bolt11Tag) {
          amountSats = parseBolt11AmountToSats(bolt11Tag[1]);
        }

        if (amountSats == null) {
          const amountTag = requestTags.find(tag => tag[0] === 'amount' && tag[1]);
          if (amountTag) {
            const msats = parseInt(amountTag[1]);
            if (!isNaN(msats) && msats > 0) amountSats = Math.floor(msats / 1000);
          }
        }

        if (amountSats == null) {
          const receiptAmountTag = event.tags.find(tag => tag[0] === 'amount' && tag[1]);
          if (receiptAmountTag) {
            const msats = parseInt(receiptAmountTag[1]);
            if (!isNaN(msats) && msats > 0) amountSats = Math.floor(msats / 1000);
          }
        }

        const zapperPubkey: string | undefined = typeof zapRequestEvent.pubkey === 'string' ? zapRequestEvent.pubkey : undefined;
        const actorProfile = zapperPubkey
          ? await fetchProfile(zapperPubkey, relays)
          : await fetchProfile(event.pubkey, relays);

        let baseTweet: Tweet | null = null;
        if (targetNoteId) {
          const originalEvent = await getCachedEvent(targetNoteId);
          if (originalEvent) {
            baseTweet = await nostrEventToTweet(originalEvent, relays);
          }
        }

        if (!baseTweet) {
          const recipientProfile = await fetchProfile(event.pubkey, relays);
          baseTweet = {
            id: targetNoteId || event.id,
            // 元の投稿イベントを取得できなかった場合は本文は空。Zapメッセージは activity.message として表示する
            content: '',
            author: recipientProfile,
            createdAt: new Date(event.created_at * 1000),
            likesCount: 0,
            retweetsCount: 0,
            repliesCount: 0,
            zapsCount: 0,
            isLiked: false,
            isRetweeted: false,
            tags: Array.isArray(zapRequestEvent.tags) ? zapRequestEvent.tags : [],
          };
        }

        baseTweet.activity = {
          type: 'zap',
          actor: actorProfile,
          sourceEventId: event.id,
          targetNoteId: targetNoteId || baseTweet.id,
          amountSats: amountSats ?? 0,
          message: zapMessage,
        };
        baseTweet.zapsCount = (baseTweet.zapsCount || 0) + 1;
        baseTweet.activityTimestamp = new Date(event.created_at * 1000);
        pushTweet(event, baseTweet);
      };

      const processEvent = async (event: NostrEvent) => {
        try {
          if (event.kind === KIND_TEXT_NOTE) {
            await processNoteEvent(event);
            return;
          }

          if (!includeActivities) return;

          if (event.kind === KIND_REPOST) {
            await processRepostEvent(event);
            return;
          }

          if (event.kind === KIND_REACTION) {
            await processReactionEvent(event);
            return;
          }

          if (event.kind === KIND_ZAP_RECEIPT) {
            await processZapEvent(event);
            return;
          }
        } catch (conversionError) {
          console.error('[fetchTimeline] Failed to convert event', conversionError);
        }
      };

      const finalize = async () => {
        const finalizeStart = Date.now();

        if (timelineTweets.length > 0) {
          const uniqueNoteIds = Array.from(new Set(timelineTweets.map(t => t.id)));
          if (uniqueNoteIds.length > 0) {
            const reactionCounts = await fetchReactionCounts(uniqueNoteIds, relays);
            timelineTweets.forEach(tweet => {
              tweet.likesCount = reactionCounts.get(tweet.id) || tweet.likesCount;
            });
          }
        }

        timelineTweets.sort((a, b) => {
          const aDate = a.activityTimestamp ?? a.createdAt;
          const bDate = b.activityTimestamp ?? b.createdAt;
          const aTime = aDate instanceof Date ? aDate.getTime() : new Date(aDate).getTime();
          const bTime = bDate instanceof Date ? bDate.getTime() : new Date(bDate).getTime();
          return bTime - aTime;
        });

        const sliced = timelineTweets.slice(0, limit);

        const oldestEvent = events.length > 0
          ? events.reduce((oldest, event) =>
              event.created_at < oldest.created_at ? event : oldest
            )
          : null;

        const totalElapsed = Date.now() - startTime;
        const finalizeElapsed = Date.now() - finalizeStart;

        // メトリクスログ
        const duplicateRate = timelineTweets.length > 0
          ? ((timelineTweets.length - new Set(timelineTweets.map(t => t.id)).size) / timelineTweets.length * 100).toFixed(2)
          : 0;

        console.log(`[fetchTimeline] Complete - type: ${params.type}, tweets: ${sliced.length}/${timelineTweets.length}, duplicates: ${duplicateRate}%, total: ${totalElapsed}ms, finalize: ${finalizeElapsed}ms`);
        console.log(`[fetchTimeline] Metrics - cursor: ${params.cursor || 'none'}, followingList: ${followingList.length}, relays: ${relays.length}`);

        resolve({
          tweets: sliced,
          nextCursor: oldestEvent ? oldestEvent.created_at.toString() : undefined,
          hasMore: timelineTweets.length > sliced.length,
        });
      };

      const sub = subscribeTo(
        relays,
        [filters],
        (event: NostrEvent) => {
          processEvent(event).catch(error => {
            console.error('[fetchTimeline] Failed to process event:', error);
          });
        }
      );

      timeoutId = setTimeout(() => {
        sub.close();
        finalize();
      }, includeActivities ? 7000 : 5000);
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
