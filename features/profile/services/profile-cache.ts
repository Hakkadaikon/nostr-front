import { nip19 } from 'nostr-tools';
import { subscribeTo } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_METADATA } from '../../../lib/nostr/constants';
import type { Event as NostrEvent } from 'nostr-tools';
import type { NotificationUser } from '../../../types/notification';
import { getProfileImageUrl } from '../../../lib/utils/avatar';

// プロフィールキャッシュ (5分TTL)
const PROFILE_TTL_MS = 5 * 60 * 1000;
interface CachedProfile { profile: NotificationUser; fetchedAt: number; }
const profileCache = new Map<string, CachedProfile>();
const pendingRequests = new Map<string, Promise<NotificationUser>>();

/**
 * プロフィール情報を取得
 */
export async function fetchProfileForNotification(pubkey: string, opts?: { forceRefresh?: boolean }): Promise<NotificationUser> {
  const forceRefresh = opts?.forceRefresh;

  // キャッシュチェック（強制リフレッシュ時はスキップ）
  if (!forceRefresh && profileCache.has(pubkey)) {
    const cached = profileCache.get(pubkey)!;
    if (Date.now() - cached.fetchedAt < PROFILE_TTL_MS) {
      return cached.profile;
    } else {
        profileCache.delete(pubkey); // TTL切れ
    }
  }

  // 既にリクエスト中の場合は待機（強制リフレッシュ時は新規取得を優先）
  if (!forceRefresh && pendingRequests.has(pubkey)) {
    return pendingRequests.get(pubkey)!;
  }

  // プロフィール取得のPromiseを作成
  const promise = fetchProfileFromNostr(pubkey);
  pendingRequests.set(pubkey, promise);

  try {
    const profile = await promise;
    profileCache.set(pubkey, { profile, fetchedAt: Date.now() });
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
    avatar: getProfileImageUrl(null, pubkey), // 統一されたアバター生成
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
      // 受信した metadata の中で最新(created_at 最大)を選択
      const events: NostrEvent[] = [];
      let finalized = false;

      const finalize = () => {
        if (finalized) return;
        finalized = true;
        if (events.length === 0) {
          resolve(defaultProfile);
          return;
        }
        const latest = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));
        try {
          const metadata = JSON.parse(latest.content);
          resolve({
            id: pubkey,
            pubkey,
            npub,
            name: metadata.display_name || metadata.name || defaultProfile.name,
            username: metadata.username || metadata.name || defaultProfile.username,
            avatar: getProfileImageUrl(metadata.picture, pubkey),
          });
        } catch (e) {
          console.error('Failed to parse profile metadata:', e);
          resolve(defaultProfile);
        }
      };

      const timeoutId = setTimeout(() => {
        finalize();
        sub.close();
      }, 1800); // 少し短縮して高速化

      const sub = subscribeTo(
        relays,
        [{ kinds: [KIND_METADATA], authors: [pubkey], limit: 10 }],
        (event: NostrEvent) => {
          events.push(event);
        },
        () => {
          clearTimeout(timeoutId);
          finalize();
          sub.close();
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
  if (typeof window !== 'undefined') {
  }
  pendingRequests.clear();
}

/**
 * avatar の強制再取得（UI で最新を強制したい場合に使用）
 */
export async function refreshProfileAvatar(pubkey: string): Promise<NotificationUser> {
  return fetchProfileForNotification(pubkey, { forceRefresh: true });
}