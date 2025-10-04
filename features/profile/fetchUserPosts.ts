import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { KIND_TEXT_NOTE, KIND_REACTION, KIND_REPOST, KIND_ZAP_RECEIPT } from '../../lib/nostr/constants';
import { Tweet } from '../timeline/types';
import { getProfileImageUrl } from '../../lib/utils/avatar';
import { toTimestamp } from '../../lib/utils/date';

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
          // リアクションをカウント
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
 * 特定ユーザーの投稿を取得
 */
export async function fetchUserPosts(npub: string, limit: number = 20): Promise<Tweet[]> {
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
      const posts: Tweet[] = [];
      let timeoutId: NodeJS.Timeout;

      const sub = subscribeTo(
        relays,
        [{
          kinds: [KIND_TEXT_NOTE],
          authors: [pubkey],
          limit: limit
        }],
        async (event: NostrEvent) => {
          // NIP-10: 'e'タグを持つイベント（リプライ）を除外
          const hasETag = event.tags.some(tag => tag[0] === 'e');
          if (hasETag) return;

          // プロフィール情報を作成（簡易版）
          const author = {
            id: pubkey,
            username: npub.slice(0, 12),
            name: 'Loading...',
            avatar: getProfileImageUrl(null, pubkey), // 統一されたアバター生成
            bio: '',
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date()
          };

          const tweet: Tweet = {
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

          posts.push(tweet);

          // 必要数に達したら完了
          if (posts.length >= limit) {
            clearTimeout(timeoutId);
            sub.close();
            
            // リアクション数を取得
            const postIds = posts.map(p => p.id);
            const reactionCounts = await fetchPostReactions(postIds.slice(0, limit), relays);
            
            // リアクション数を更新
            posts.forEach(post => {
              const counts = reactionCounts.get(post.id);
              if (counts) {
                post.likesCount = counts.likes;
                post.retweetsCount = counts.reposts;
                post.zapsCount = counts.zaps;
              }
            });
            
            // 時系列でソート（新しい順）
            posts.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
            resolve(posts.slice(0, limit));
          }
        }
      );

      // タイムアウト設定（3秒）
      timeoutId = setTimeout(async () => {
        sub.close();
        
        // リアクション数を取得
        if (posts.length > 0) {
          const postIds = posts.map(p => p.id);
          const reactionCounts = await fetchPostReactions(postIds, relays);
          
          // リアクション数を更新
          posts.forEach(post => {
            const counts = reactionCounts.get(post.id);
            if (counts) {
              post.likesCount = counts.likes;
              post.retweetsCount = counts.reposts;
              post.zapsCount = counts.zaps;
            }
          });
        }
        
        // 時系列でソート（新しい順）
        posts.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
        resolve(posts);
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch user posts:', error);
    return [];
  }
}