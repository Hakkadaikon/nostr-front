import { SimplePool, type Filter, type Event as NostrEvent } from 'nostr-tools';

export type Subscription = { close: () => void };
export type PublishResult = { relay: string; ok: boolean; error?: unknown };

let pool: SimplePool | null = null;

function getPool() {
  if (!pool) pool = new SimplePool();
  return pool;
}

export function subscribe(relays: string[], filters: Filter[], onEvent: (e: NostrEvent) => void): Subscription {
  const p = getPool();
  const sub = p.sub(relays, filters);
  sub.on('event', onEvent);
  return { close: () => sub.unsub() };
}

export async function publish(relays: string[], event: NostrEvent, retries = 1): Promise<PublishResult[]> {
  const p = getPool();
  const results: PublishResult[] = [];
  for (const url of relays) {
    let ok = false;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries && !ok; attempt++) {
      try {
        await p.publish(url, event);
        ok = true;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    results.push({ relay: url, ok, error: ok ? undefined : lastErr });
  }
  return results;
}

export function close() {
  pool?.close?.();
  pool = null;
}
