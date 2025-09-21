import type { Filter } from 'nostr-tools';
import { subscribe } from '../../lib/nostr/client';
import { decode } from '../../lib/nostr/nip19';

export async function fetchProfile(npubOrHex: string) {
  // convert npub to hex if needed
  let authorHex = npubOrHex;
  if (npubOrHex.startsWith('npub1')) {
    try { const d = decode(npubOrHex); authorHex = d.data as string; } catch {}
  }
  const relays = require('../../stores/relays.store').useRelaysStore.getState().relays.filter((r: any) => r.read).map((r: any) => r.url);
  return new Promise<any>((resolve) => {
    const filters: Filter[] = [{ kinds: [0], authors: [authorHex], limit: 1 } as any];
    const sub = subscribe(relays, filters, (e) => {
      try { resolve(JSON.parse(e.content)); } catch { resolve({}); }
      sub.close();
    });
    setTimeout(() => { resolve({}); sub.close(); }, 1500);
  });
}
