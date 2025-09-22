import { subscribeTo } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { Event as NostrEvent } from 'nostr-tools';
import { KIND_FOLLOW, KIND_TEXT_NOTE } from '../../../lib/nostr/constants';

/**
 * ユーザーのフォロー数を取得
 */
export async function fetchFollowingCount(pubkey: string): Promise<number> {
  const relays = useRelaysStore.getState().relays
    .filter(r => r.read)
    .map(r => r.url);

  if (relays.length === 0) return 0;

  return new Promise((resolve) => {
    let followingCount = 0;
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      relays,
      [{ kinds: [KIND_FOLLOW], authors: [pubkey], limit: 1 }],
      (event: NostrEvent) => {
        // kind 3 (contact list) のpタグがフォロー中のユーザー
        const pTags = event.tags.filter(tag => tag[0] === 'p');
        followingCount = pTags.length;
        clearTimeout(timeoutId);
        sub.close();
        resolve(followingCount);
      }
    );

    // タイムアウト設定（2秒）
    timeoutId = setTimeout(() => {
      sub.close();
      resolve(followingCount);
    }, 2000);
  });
}

/**
 * ユーザーのフォロワー数を取得
 */
export async function fetchFollowerCount(pubkey: string): Promise<number> {
  const relays = useRelaysStore.getState().relays
    .filter(r => r.read)
    .map(r => r.url);

  if (relays.length === 0) return 0;

  return new Promise((resolve) => {
    const followers = new Set<string>();
    let timeoutId: NodeJS.Timeout;

    // 自分をフォローしているユーザーを探す
    const sub = subscribeTo(
      relays,
      [{ kinds: [KIND_FOLLOW], '#p': [pubkey] }],
      (event: NostrEvent) => {
        followers.add(event.pubkey);
      }
    );

    // タイムアウト設定（3秒）
    timeoutId = setTimeout(() => {
      sub.close();
      resolve(followers.size);
    }, 3000);
  });
}

/**
 * ユーザーの投稿数を取得
 */
export async function fetchPostCount(pubkey: string): Promise<number> {
  const relays = useRelaysStore.getState().relays
    .filter(r => r.read)
    .map(r => r.url);

  if (relays.length === 0) return 0;

  return new Promise((resolve) => {
    let postCount = 0;
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      relays,
      [{ 
        kinds: [KIND_TEXT_NOTE], 
        authors: [pubkey],
        // 最新1000件まで取得（全投稿数のカウントには制限がある）
        limit: 1000
      }],
      (event: NostrEvent) => {
        postCount++;
      }
    );

    // タイムアウト設定（3秒）
    timeoutId = setTimeout(() => {
      sub.close();
      resolve(postCount);
    }, 3000);
  });
}

/**
 * プロフィール統計情報を一度に取得
 */
export interface ProfileStats {
  followingCount: number;
  followerCount: number;
  postCount: number;
}

export async function fetchProfileStats(pubkey: string): Promise<ProfileStats> {
  const [followingCount, followerCount, postCount] = await Promise.all([
    fetchFollowingCount(pubkey),
    fetchFollowerCount(pubkey),
    fetchPostCount(pubkey)
  ]);

  return {
    followingCount,
    followerCount,
    postCount
  };
}