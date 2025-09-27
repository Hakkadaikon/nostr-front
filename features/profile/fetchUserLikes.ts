import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { KIND_TEXT_NOTE, KIND_REACTION, KIND_REPOST, KIND_ZAP_RECEIPT } from '../../lib/nostr/constants';
import { Tweet } from '../timeline/types';
import { getProfileImageUrl } from '../../lib/utils/avatar';

/**
 * 投稿の詳細情報を取得
 */
async function fetchPostDetails(postIds: string[], relays: string[]): Promise<Map<string, NostrEvent>> {
  const posts = new Map<string, NostrEvent>();

  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      relays,
      [{
        kinds: [KIND_TEXT_NOTE],
        ids: postIds,
      }],
      (event: NostrEvent) => {
        posts.set(event.id, event);

        // すべて取得できたら完了
        if (posts.size >= postIds.length) {
          clearTimeout(timeoutId);
          sub.close();
          resolve(posts);
        }
      }
    );

    // タイムアウト設定（3秒）
    timeoutId = setTimeout(() => {
      sub.close();
      resolve(posts);
    }, 3000);
  });
}

/**
 * 投稿のリアクション数を取得
 */
async function fetchPostReactions(postIds: string[], relays: string[]): Promise<Map<string, { likes: number; reposts: number; zaps: number }>> {
  const reactionCounts = new Map<string, { likes: number; reposts: number; zaps: number }>();

  // 初期化
  postIds.forEach(id => {
    reactionCounts.set(id, { likes: 0, reposts: 0, zaps: 0 });
  });

  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      relays,
      [{
        kinds: [KIND_REACTION, KIND_REPOST, KIND_ZAP_RECEIPT],
        '#e': postIds,
      }],
      (event: NostrEvent) => {
        const targetPostId = event.tags.find(tag => tag[0] === 'e')?.[1];
        if (!targetPostId || !reactionCounts.has(targetPostId)) return;

        const counts = reactionCounts.get(targetPostId)!;

        if (event.kind === KIND_REACTION) {
          // リアクション（いいね）をカウント
          if (event.content === '+' || event.content === '🤙' || event.content === '❤️' || event.content === '👍') {
            counts.likes++;
          }
        } else if (event.kind === KIND_REPOST) {
          // リポストをカウント
          counts.reposts++;
        } else if (event.kind === KIND_ZAP_RECEIPT) {
          // Zapをカウント
          counts.zaps++;
        }
      }
    );

    // タイムアウト設定（2秒）
    timeoutId = setTimeout(() => {
      sub.close();
      resolve(reactionCounts);
    }, 2000);
  });
}

/**
 * 特定ユーザーがいいねした投稿を取得
 */
export async function fetchUserLikes(npub: string, limit: number = 20): Promise<Tweet[]> {
  try {
    // npubをhex形式の公開鍵に変換
    let pubkey: string;
    try {
      const decoded = nip19.decode(npub);
      if (decoded.type === 'npub') {
        pubkey = decoded.data as string;
      } else {
        console.error('Invalid npub format');
        return [];
      }
    } catch (error) {
      console.error('Failed to decode npub:', error);
      return [];
    }

    // リレー設定を取得
    const relaysStore = useRelaysStore.getState();
    let relays = getReadRelays(relaysStore.relays);

    if (relays.length === 0) {
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        relays = [
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://relay.nostr.band'
        ];
      }
    }

    return new Promise(async (resolve) => {
      const likedPostIds: string[] = [];
      let timeoutId: NodeJS.Timeout;

      // まずユーザーのいいねイベントを取得
      const likesSub = subscribeTo(
        relays,
        [{
          kinds: [KIND_REACTION],
          authors: [pubkey],
          limit: limit * 2, // いいねを多めに取得
        }],
        (event: NostrEvent) => {
          // いいねリアクションかチェック
          if (event.content === '+' || event.content === '🤙' || event.content === '❤️' || event.content === '👍') {
            const targetPostId = event.tags.find(tag => tag[0] === 'e')?.[1];
            if (targetPostId && !likedPostIds.includes(targetPostId)) {
              likedPostIds.push(targetPostId);

              // 必要数に達したら投稿の詳細を取得開始
              if (likedPostIds.length >= limit) {
                clearTimeout(timeoutId);
                likesSub.close();
                fetchLikedPostsDetails();
              }
            }
          }
        }
      );

      // いいねした投稿の詳細を取得
      const fetchLikedPostsDetails = async () => {
        const targetPostIds = likedPostIds.slice(0, limit);
        const postDetails = await fetchPostDetails(targetPostIds, relays);
        const reactionCounts = await fetchPostReactions(targetPostIds, relays);

        const likedPosts: Tweet[] = [];

        for (const [postId, postEvent] of postDetails) {
          const author = {
            id: postEvent.pubkey,
            username: postEvent.pubkey.slice(0, 12),
            name: 'Loading...',
            avatar: getProfileImageUrl(null, postEvent.pubkey), // 統一されたアバター生成
            bio: '',
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date()
          };

          const counts = reactionCounts.get(postId) || { likes: 0, reposts: 0, zaps: 0 };

          const tweet: Tweet = {
            id: postEvent.id,
            content: postEvent.content,
            author,
            createdAt: new Date(postEvent.created_at * 1000),
            likesCount: counts.likes,
            retweetsCount: counts.reposts,
            repliesCount: 0,
            zapsCount: counts.zaps,
            isLiked: true, // このユーザーがいいねした投稿なので常にtrue
            isRetweeted: false
          };

          likedPosts.push(tweet);
        }

        // 時系列でソート（新しい順）
        likedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(likedPosts);
      };

      // タイムアウト設定（3秒）
      timeoutId = setTimeout(() => {
        likesSub.close();

        if (likedPostIds.length > 0) {
          fetchLikedPostsDetails();
        } else {
          resolve([]);
        }
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch user likes:', error);
    return [];
  }
}