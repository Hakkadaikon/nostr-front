import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { KIND_TEXT_NOTE } from '../../lib/nostr/constants';
import { Tweet } from '../timeline/types';

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
            
            // 時系列でソート（新しい順）
            posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            resolve(posts.slice(0, limit));
          }
        }
      );

      // タイムアウト設定（3秒）
      timeoutId = setTimeout(() => {
        sub.close();
        
        // 時系列でソート（新しい順）
        posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(posts);
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch user posts:', error);
    return [];
  }
}