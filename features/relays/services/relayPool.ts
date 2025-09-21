import { SimplePool, type Event as NostrEvent, type Filter } from 'nostr-tools';

export type RelayInfo = { url: string; read: boolean; write: boolean; healthy?: boolean };
export type Subscription = { close: () => void };

let pool: SimplePool | null = null;
function getPool() { return (pool ??= new SimplePool()); }

export function getReadRelays(relays: RelayInfo[]) {
  return relays.filter(r => r.read).map(r => r.url);
}
export function getWriteRelays(relays: RelayInfo[]) {
  return relays.filter(r => r.write).map(r => r.url);
}

export function subscribeTo(relays: string[], filters: Filter[], onEvent: (e: NostrEvent) => void): Subscription {
  const p = getPool();
  const sub = p.sub(relays, filters);
  sub.on('event', onEvent);
  return { close: () => sub.unsub() };
}

export async function publishTo(relays: string[], event: NostrEvent) {
  const p = getPool();
  const results: { relay: string; ok: boolean; error?: any }[] = [];
  for (const url of relays) {
    try {
      await p.publish(url, event);
      results.push({ relay: url, ok: true });
    } catch (e) {
      results.push({ relay: url, ok: false, error: e });
    }
  }
  return results;
}

export async function checkRelayHealth(url: string, timeoutMs = 1500) {
  try {
    const p = getPool();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    // SimplePool.connect doesn't exist; we emulate with a dummy sub that immediately closes
    const sub = p.sub([url], [{ kinds: [0], limit: 1 }]);
    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      sub.on('event', () => { if (!resolved) { resolved = true; resolve(); } });
      sub.on('eose', () => { if (!resolved) { resolved = true; resolve(); } });
      controller.signal.addEventListener('abort', () => reject(new Error('timeout')));
    });
    clearTimeout(t);
    sub.unsub();
    return true;
  } catch {
    return false;
  }
}
