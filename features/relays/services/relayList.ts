import type { Filter, Event as NostrEvent } from 'nostr-tools';
import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_RELAY_LIST_METADATA } from '../../../lib/nostr/constants';

export type RelayFromNip65 = { url: string; read: boolean; write: boolean };

function parseRelayTagsFromEvent(e: NostrEvent): RelayFromNip65[] {
  // NIP-65 uses "r" tags: ["r", url, marker?] where marker can be "read" or "write".
  // If marker is omitted or unrecognized, treat as both read & write.
  const map = new Map<string, { read: boolean; write: boolean }>();
  for (const tag of e.tags) {
    if (tag[0] !== 'r' || !tag[1]) continue;
    const url = tag[1];
    const marker = (tag[2] || '').toLowerCase();
    const prev = map.get(url) || { read: false, write: false };
    if (marker === 'read') {
      prev.read = true;
    } else if (marker === 'write') {
      prev.write = true;
    } else if (marker === 'rw') {
      prev.read = true; prev.write = true;
    } else {
      // default: both
      prev.read = true; prev.write = true;
    }
    map.set(url, prev);
  }
  return Array.from(map.entries()).map(([url, v]) => ({ url, read: v.read, write: v.write }));
}

export async function fetchRelayListForPubkey(pubkey: string, timeoutMs = 1200): Promise<RelayFromNip65[] | null> {
  // Use current read relays from store as bootstrap
  const bootstrapRelays = useRelaysStore.getState().relays.filter(r => r.read).map(r => r.url);
  if (bootstrapRelays.length === 0) return null;

  const filters: Filter[] = [{ kinds: [KIND_RELAY_LIST_METADATA], authors: [pubkey] } as any];
  let latest: NostrEvent | null = null;

  return await new Promise((resolve) => {
    const sub = subscribe(bootstrapRelays, filters, (e) => {
      if (e.kind !== KIND_RELAY_LIST_METADATA) return;
      if (!latest || (e.created_at ?? 0) > (latest.created_at ?? 0)) {
        latest = e;
      }
    });

    const t = setTimeout(() => {
      sub.close();
      if (!latest) return resolve(null);
      try {
        const relays = parseRelayTagsFromEvent(latest);
        resolve(relays);
      } catch {
        resolve(null);
      }
    }, timeoutMs);

    // Safety in case of early end-of-stream (not all relays send EOSE via SimplePool callback here)
    // We'll rely on timeout to collect the latest across relays.
  });
}
