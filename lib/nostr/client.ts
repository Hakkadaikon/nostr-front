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
  const sub = p.subscribeMany(relays, filters, {
    onevent: onEvent
  });
  return { close: () => sub.close() };
}

export async function publish(relays: string[], event: NostrEvent, retries = 1): Promise<PublishResult[]> {
  const p = getPool();
  const results: PublishResult[] = [];

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 300 * attempt));
    }

    const promises = p.publish(relays, event);

    await Promise.all(promises.map(async (promise, index) => {
      try {
        await promise;
        if (!results[index] || !results[index].ok) {
          results[index] = { relay: relays[index], ok: true };
        }
      } catch (err) {
        if (!results[index]) {
          results[index] = { relay: relays[index], ok: false, error: err };
          console.warn(`[publish] Failed on relay: ${relays[index]}`, err);
        }
      }
    }));
  }

  const successCount = results.filter(r => r.ok).length;

  return results;
}

export function close() {
  if (pool) {
    // SimplePool.close requires relay URLs, but we want to close all
    // So we'll just set pool to null and let garbage collection handle it
    pool = null;
  }
}
