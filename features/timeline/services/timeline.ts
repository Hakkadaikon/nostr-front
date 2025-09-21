import { TimelineParams, TimelineResponse, Tweet } from '../types';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { format } from 'date-fns';

// Nostrイベント種別
const KIND_TEXT_NOTE = 1;
const KIND_METADATA = 0;

// プロフィール情報のキャッシュ
const profileCache = new Map<string, any>();

/**
 * Nostrイベントからプロフィール情報を取得
 */
async function fetchProfile(pubkey: string, relays: string[]): Promise<any> {
  // キャッシュチェック
  if (profileCache.has(pubkey)) {
    return profileCache.get(pubkey);
  }

  return new Promise((resolve) => {
    let profile: any = null;
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      relays,
      [{ kinds: [KIND_METADATA], authors: [pubkey], limit: 1 }],
      (event: NostrEvent) => {
        try {
          const content = JSON.parse(event.content);
          profile = {
            id: pubkey,
            username: content.username || content.name || nip19.npubEncode(pubkey).slice(0, 12),
            name: content.display_name || content.name || '',
            avatar: content.picture || `https://robohash.org/${pubkey}`,
            bio: content.about || '',
            followersCount: 0, // Nostrでは直接取得できないため
            followingCount: 0, // Nostrでは直接取得できないため
            createdAt: new Date(event.created_at * 1000)
          };
          profileCache.set(pubkey, profile);
          clearTimeout(timeoutId);
          sub.close();
          resolve(profile);
        } catch (error) {
          console.error('Failed to parse profile:', error);
        }
      }
    );

    // タイムアウト設定（1.5秒）
    timeoutId = setTimeout(() => {
      sub.close();
      // デフォルトプロフィールを返す
      const defaultProfile = {
        id: pubkey,
        username: nip19.npubEncode(pubkey).slice(0, 12),
        name: 'Nostr User',
        avatar: `https://robohash.org/${pubkey}`,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date()
      };
      profileCache.set(pubkey, defaultProfile);
      resolve(defaultProfile);
    }, 1500);
  });
}

/**
 * NostrイベントをTweet型に変換
 */
async function nostrEventToTweet(event: NostrEvent, relays: string[]): Promise<Tweet> {
  const profile = await fetchProfile(event.pubkey, relays);
  
  return {
    id: event.id,
    content: event.content,
    author: profile,
    createdAt: new Date(event.created_at * 1000),
    likesCount: 0, // Nostrでは反応数を別途集計する必要がある
    retweetsCount: 0, // Nostrではリポスト数を別途集計する必要がある
    repliesCount: 0, // Nostrでは返信数を別途集計する必要がある
    isLiked: false, // ユーザーの反応状態は別途確認が必要
    isRetweeted: false // ユーザーのリポスト状態は別途確認が必要
  };
}

/**
 * タイムラインデータを取得
 */
export async function fetchTimeline(params: TimelineParams): Promise<TimelineResponse> {
  try {
    // リレー設定を取得
    const relaysStore = useRelaysStore.getState();
    let relays = getReadRelays(relaysStore.relays);
    
    if (relays.length === 0) {
      // 環境変数からデフォルトリレーを取得
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        // フォールバック用のデフォルトリレー
        relays = [
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://relay.nostr.band'
        ];
      }
    }

    const limit = params.limit || 20;
    const until = params.cursor ? parseInt(params.cursor) : Math.floor(Date.now() / 1000);

    // Nostrイベントを収集
    const events: NostrEvent[] = [];
    const tweets: Tweet[] = [];

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;

      const sub = subscribeTo(
        relays,
        [{
          kinds: [KIND_TEXT_NOTE],
          limit: limit,
          until: until
        }],
        async (event: NostrEvent) => {
          // 重複チェック
          if (!events.find(e => e.id === event.id)) {
            events.push(event);
            const tweet = await nostrEventToTweet(event, relays);
            tweets.push(tweet);
          }

          // 必要数に達したら完了
          if (tweets.length >= limit) {
            clearTimeout(timeoutId);
            sub.close();
            
            // 時系列でソート（新しい順）
            tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            const oldestEvent = events.reduce((oldest, event) => 
              event.created_at < oldest.created_at ? event : oldest
            );
            
            resolve({
              tweets: tweets.slice(0, limit),
              nextCursor: oldestEvent.created_at.toString(),
              hasMore: true // Nostrは常に過去のイベントを取得可能
            });
          }
        }
      );

      // タイムアウト設定（3秒）
      timeoutId = setTimeout(() => {
        sub.close();
        
        // 時系列でソート（新しい順）
        tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        const oldestEvent = events.length > 0 
          ? events.reduce((oldest, event) => 
              event.created_at < oldest.created_at ? event : oldest
            )
          : null;
        
        resolve({
          tweets,
          nextCursor: oldestEvent ? oldestEvent.created_at.toString() : undefined,
          hasMore: tweets.length === limit
        });
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
    throw error;
  }
}

/**
 * ツイートをいいねする（Nostrでは反応イベントを送信）
 */
export async function likeTweet(tweetId: string): Promise<void> {
  try {
    // TODO: Nostrの反応イベント（Kind 7）を実装
    console.log('Like tweet:', tweetId);
    await new Promise(resolve => setTimeout(resolve, 200));
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
    // TODO: Nostrの削除イベント（Kind 5）を実装
    console.log('Unlike tweet:', tweetId);
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error('Failed to unlike tweet:', error);
    throw error;
  }
}

/**
 * ツイートをリツイートする（Nostrではリポストイベントを送信）
 */
export async function retweet(tweetId: string): Promise<void> {
  try {
    // TODO: Nostrのリポストイベント（Kind 6）を実装
    console.log('Retweet:', tweetId);
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error('Failed to retweet:', error);
    throw error;
  }
}

/**
 * リツイートを取り消す（Nostrでは削除イベントを送信）
 */
export async function undoRetweet(tweetId: string): Promise<void> {
  try {
    // TODO: Nostrの削除イベント（Kind 5）を実装
    console.log('Undo retweet:', tweetId);
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error('Failed to undo retweet:', error);
    throw error;
  }
}