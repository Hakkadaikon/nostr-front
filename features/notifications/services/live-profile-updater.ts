import { subscribeTo } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_METADATA } from '../../../lib/nostr/constants';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useNotificationStore } from '../../../stores/notification.store';
import { getProfileImageUrl } from '../../../lib/utils/avatar';

// 起動中に通知に登場する pubkey の最新 metadata を追跡し、変化があれば即座にストアを更新
// パフォーマンス: まとめて購読するため、同じ pubkey への重複subscribeは避ける

const tracked = new Set<string>();
let batch: string[] = [];
let flushTimer: any = null;

function flushSubscribe() {
  if (batch.length === 0) return;
  const relaysStore = useRelaysStore.getState();
  const relays = relaysStore.relays.filter(r => r.read).map(r => r.url);
  if (relays.length === 0) return;

  const authors = [...batch];
  batch = [];

  const filters: Filter[] = [
    { kinds: [KIND_METADATA], authors, limit: 1 }
  ];

  subscribeTo(relays, filters, (event: NostrEvent) => {
    try {
      const meta = JSON.parse(event.content);
      useNotificationStore.getState().updateUserProfile(event.pubkey, {
        name: meta.display_name || meta.name,
        username: meta.username || meta.name,
        avatar: getProfileImageUrl(meta.picture, event.pubkey)
      });
    } catch (e) {
    }
  });
}

export function ensureLiveProfileTracking(pubkey: string) {
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
