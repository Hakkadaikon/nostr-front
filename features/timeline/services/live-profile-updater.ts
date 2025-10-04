import { subscribeTo, type Subscription } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useProfileStore } from '../../../stores/profile.store';
import { KIND_METADATA } from '../../../lib/nostr/constants';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { getProfileImageUrl } from '../../../lib/utils/avatar';

// タイムラインに登場する pubkey の最新 metadata を追跡し、変化があれば即座にストアを更新
// パフォーマンス: まとめて購読するため、同じ pubkey への重複subscribeは避ける

const tracked = new Set<string>();
let batch: string[] = [];
let flushTimer: any = null;
const subscriptions: Subscription[] = [];

function flushSubscribe() {
  if (batch.length === 0) return;
  const relaysStore = useRelaysStore.getState();
  const relays = relaysStore.relays.filter(r => r.read).map(r => r.url);
  if (relays.length === 0) return;

  const authors = [...batch];
  batch = [];

  // リアルタイム更新: 現在時刻以降の新しいmetadataイベントを継続的に監視
  const filters: Filter[] = [
    { kinds: [KIND_METADATA], authors, since: Math.floor(Date.now() / 1000) }
  ];

  const sub = subscribeTo(relays, filters, (event: NostrEvent) => {
    try {
      const meta = JSON.parse(event.content);
      const avatarUrl = getProfileImageUrl(meta.picture, event.pubkey);
      useProfileStore.getState().updateProfilePicture(event.pubkey, avatarUrl);
    } catch (e) {
      console.warn('timeline-live-profile-updater: failed to parse metadata', e);
    }
  });

  subscriptions.push(sub);
}

// クリーンアップ関数: 全てのsubscriptionを閉じる（必要に応じて呼び出す）
export function cleanupTimelineLiveProfileTracking() {
  subscriptions.forEach(sub => sub.close());
  subscriptions.length = 0;
  tracked.clear();
  batch = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export function ensureTimelineLiveProfileTracking(pubkey: string) {
  if (tracked.has(pubkey)) return;
  tracked.add(pubkey);
  batch.push(pubkey);
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushSubscribe();
    }, 200); // 200ms デバウンスでまとめる
  }
}
