import type { Event as NostrEvent } from 'nostr-tools';

export function normalize(events: NostrEvent[]): NostrEvent[] {
  const map = new Map<string, NostrEvent>();
  for (const e of events) map.set(e.id, e);
  return Array.from(map.values()).sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
}

export function dedupePush(list: NostrEvent[], e: NostrEvent) {
  const exists = list.find(x => x.id === e.id);
  if (exists) return list;
  return normalize([...list, e]);
}
