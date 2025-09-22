import { nip19 } from 'nostr-tools';
import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_METADATA } from '../../../lib/nostr/constants';
import type { Event as NostrEvent } from 'nostr-tools';
import type { NotificationUser } from '../../../types/notification';

// プロフィールキャッシュ
const profileCache = new Map<string, NotificationUser>();
const pendingRequests = new Map<string, Promise<NotificationUser>>();

/**
 * プロフィール情報を取得
 */
export async function fetchProfileForNotification(pubkey: string): Promise<NotificationUser> {
  // キャッシュチェック
  if (profileCache.has(pubkey)) {
    return profileCache.get(pubkey)!;
  }

  // 既にリクエスト中の場合は待機
  if (pendingRequests.has(pubkey)) {
    return pendingRequests.get(pubkey)!;
  }

  // プロフィール取得のPromiseを作成
  const promise = fetchProfileFromNostr(pubkey);
  pendingRequests.set(pubkey, promise);

  try {
    const profile = await promise;
    profileCache.set(pubkey, profile);
    return profile;
  } finally {
    pendingRequests.delete(pubkey);
  }
}

/**
 * Nostrからプロフィール情報を取得
 */
async function fetchProfileFromNostr(pubkey: string): Promise<NotificationUser> {
  const npub = nip19.npubEncode(pubkey);
  const defaultProfile: NotificationUser = {
    id: pubkey,
    pubkey,
    npub,
    name: npub.slice(0, 12) + '...',
    username: npub.slice(0, 8),
    avatar: `https://robohash.org/${pubkey}`,
  };

  try {
    // リレーを取得
    const relaysStore = useRelaysStore.getState();
    const relays = relaysStore.relays
      .filter(r => r.read)
      .map(r => r.url);

    if (relays.length === 0) {
      return defaultProfile;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          sub.close();
          resolve(defaultProfile);
        }
      }, 2000); // 2秒でタイムアウト

      const sub = subscribe(
        relays,
        [{ kinds: [KIND_METADATA], authors: [pubkey], limit: 1 }],
        (event: NostrEvent) => {
          if (resolved) return;

          try {
            const metadata = JSON.parse(event.content);
            resolved = true;
            clearTimeout(timeoutId);
            sub.close();

            resolve({
              id: pubkey,
              pubkey,
              npub,
              name: metadata.display_name || metadata.name || defaultProfile.name,
              username: metadata.username || metadata.name || defaultProfile.username,
              avatar: metadata.picture || defaultProfile.avatar,
            });
          } catch (error) {
            console.error('Failed to parse profile metadata:', error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return defaultProfile;
  }
}

/**
 * キャッシュをクリア
 */
export function clearProfileCache() {
  profileCache.clear();
  pendingRequests.clear();
}