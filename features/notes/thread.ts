import type { Event as NostrEvent } from 'nostr-tools';
import { extractMarkers } from '../../lib/nostr/nip10';

export type Thread = { id: string; parents: string[]; children: string[] };

export function toThread(id: string, events: NostrEvent[]) : Thread {
  const byId = new Map(events.map(e => [e.id, e] as const));
  const parents: string[] = [];
  const children: string[] = [];
  const root = byId.get(id);
  if (!root) return { id, parents, children };
  // Walk parents using tags
  let current: NostrEvent | undefined = root;
  while (current) {
    const m = extractMarkers(current.tags as any);
    if (m.reply && byId.has(m.reply)) {
      parents.push(m.reply);
      current = byId.get(m.reply);
    } else if (m.root && byId.has(m.root)) {
      parents.push(m.root);
      current = byId.get(m.root);
    } else {
      break;
    }
  }
  // Children: find events replying to this id
  for (const e of events) {
    const m = extractMarkers(e.tags as any);
    if (m.reply === id || m.root === id) children.push(e.id);
  }
  return { id, parents, children };
}
