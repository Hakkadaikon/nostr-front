import type { Event as NostrEvent } from 'nostr-tools';
import { signEvent } from '../../lib/nostr/signatures';
import { publish as publishClient } from '../../lib/nostr/client';

export async function updateProfile(input: { name?: string; about?: string; picture?: string }) {
  const relays = require('../../stores/relays.store').useRelaysStore.getState().relays.filter((r: any) => r.write).map((r: any) => r.url);
  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: 0,
    content: JSON.stringify(input),
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
  } as any;
  const signed = await signEvent(unsigned);
  const results = await publishClient(relays, signed);
  return { ok: results.some(r => r.ok), results };
}
