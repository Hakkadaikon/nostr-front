import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { KIND_TEXT_NOTE, KIND_REACTION, KIND_REPOST, KIND_ZAP_RECEIPT } from '../../lib/nostr/constants';
import { Tweet } from '../timeline/types';

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
 * 特定ユーザーの返信投稿を取得
 */
export async function fetchUserReplies(npub: string, limit: number = 20): Promise<Tweet[]> {
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

    return new Promise((resolve) => {
      const replies: Tweet[] = [];
      let timeoutId: NodeJS.Timeout;

      const sub = subscribeTo(
        relays,
        [{
          kinds: [KIND_TEXT_NOTE],
          authors: [pubkey],
          limit: limit * 3, // 返信を含む投稿を多めに取得して後でフィルタリング
        }],
        async (event: NostrEvent) => {
          // 返信かどうかをチェック（'e'タグまたは'reply'関連のタグがあるか）
          const isReply = event.tags.some(tag =>
            tag[0] === 'e' || // 他の投稿への参照
            (tag[0] === 'p' && tag[1] !== pubkey) // 他のユーザーへの言及
          );

          // 返信のみを対象とする
          if (!isReply) return;

          // プロフィール情報を作成（簡易版）
          const author = {
            id: pubkey,
            username: npub.slice(0, 12),
            name: 'Loading...',
            avatar: `https://robohash.org/${pubkey}`,
            bio: '',
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date()
          };

          const reply: Tweet = {
            id: event.id,
            content: event.content,
            author,
            createdAt: new Date(event.created_at * 1000),
            likesCount: 0,
            retweetsCount: 0,
            repliesCount: 0,
            zapsCount: 0,
            isLiked: false,
            isRetweeted: false
          };

          replies.push(reply);

          // 必要数に達したら完了
          if (replies.length >= limit) {
            clearTimeout(timeoutId);
            sub.close();

            // リアクション数を取得
            const postIds = replies.map(p => p.id);
            const reactionCounts = await fetchPostReactions(postIds.slice(0, limit), relays);

            // リアクション数を更新
            replies.forEach(reply => {
              const counts = reactionCounts.get(reply.id);
              if (counts) {
                reply.likesCount = counts.likes;
                reply.retweetsCount = counts.reposts;
                reply.zapsCount = counts.zaps;
              }
            });

            // 時系列でソート（新しい順）
            replies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            resolve(replies.slice(0, limit));
          }
        }
      );

      // タイムアウト設定（3秒）
      timeoutId = setTimeout(async () => {
        sub.close();

        // リアクション数を取得
        if (replies.length > 0) {
          const postIds = replies.map(p => p.id);
          const reactionCounts = await fetchPostReactions(postIds, relays);

          // リアクション数を更新
          replies.forEach(reply => {
            const counts = reactionCounts.get(reply.id);
            if (counts) {
              reply.likesCount = counts.likes;
              reply.retweetsCount = counts.reposts;
              reply.zapsCount = counts.zaps;
            }
          });
        }

        // 時系列でソート（新しい順）
        replies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(replies);
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch user replies:', error);
    return [];
  }
}