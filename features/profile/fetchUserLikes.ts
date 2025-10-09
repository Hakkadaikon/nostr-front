import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { KIND_TEXT_NOTE, KIND_REACTION, KIND_REPOST, KIND_ZAP_RECEIPT, KIND_METADATA } from '../../lib/nostr/constants';
import { Tweet } from '../timeline/types';
import { getProfileImageUrl } from '../../lib/utils/avatar';
import { toTimestamp } from '../../lib/utils/date';

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
        return [];
      }
    } catch (error) {
      return [];
    }

    // リレー設定を取得
    const relaysStore = useRelaysStore.getState();
    const relays = getReadRelays(relaysStore.relays);

    if (relays.length === 0) {
      return [];
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
          limit: limit * 3, // より多めに取得して、実際に詳細が取得できた投稿をlimit個確保
        }],
        (event: NostrEvent) => {
          // いいねリアクションかチェック
          if (event.content === '+' || event.content === '🤙' || event.content === '❤️' || event.content === '👍') {
            const targetPostId = event.tags.find(tag => tag[0] === 'e')?.[1];
            if (targetPostId && !likedPostIds.includes(targetPostId)) {
              likedPostIds.push(targetPostId);
            }
          }
        }
      );

      // いいねした投稿の詳細を取得
      const fetchLikedPostsDetails = async () => {
        // より多めに収集したIDから投稿詳細を取得
        const postDetails = await fetchPostDetails(likedPostIds, relays);

        // 実際に取得できた投稿のIDのみを対象にリアクション数を取得
        const availablePostIds = Array.from(postDetails.keys());
        const reactionCounts = await fetchPostReactions(availablePostIds, relays);

        // 著者ごとのプロフィールメタデータ取得用にpubkeyを収集
        const authorPubkeys = Array.from(new Set(Array.from(postDetails.values()).map(ev => ev.pubkey)));
        const authorProfiles = new Map<string, any>();

        // プロフィールメタデータ取得
        await new Promise<void>((profileResolve) => {
          if (authorPubkeys.length === 0) {
            profileResolve();
            return;
          }

          const profileSub = subscribeTo(
            relays,
            [{ kinds: [KIND_METADATA], authors: authorPubkeys, limit: 10 }],
            (event: NostrEvent) => {
              try {
                const content = JSON.parse(event.content || '{}');
                authorProfiles.set(event.pubkey, {
                  name: content.display_name || content.name || '',
                  username: content.username || content.name || event.pubkey.slice(0, 12),
                  avatar: getProfileImageUrl(content.picture, event.pubkey),
                  bio: content.about || ''
                });
              } catch {
                // ignore parse errors
              }
            }
          );

          // 1秒でタイムアウト
          setTimeout(() => {
            profileSub.close();
            profileResolve();
          }, 1000);
        });

        const likedPosts: Tweet[] = [];

        for (const [postId, postEvent] of postDetails) {
          const profile = authorProfiles.get(postEvent.pubkey);
          const author = {
            id: postEvent.pubkey,
            username: profile?.username || postEvent.pubkey.slice(0, 12),
            name: profile?.name || profile?.username || postEvent.pubkey.slice(0, 12),
            avatar: profile?.avatar || getProfileImageUrl(null, postEvent.pubkey),
            bio: profile?.bio || '',
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date()
          };

            (author as any).pubkey = postEvent.pubkey;

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
            isLiked: true,
            isRetweeted: false
          };

          likedPosts.push(tweet);
        }

        // 作成日時でソートしてlimit個に絞り込む
        likedPosts.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
        resolve(likedPosts.slice(0, limit));
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
    return [];
  }
}
