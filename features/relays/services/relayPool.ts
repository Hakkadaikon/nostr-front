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
  const sub = p.subscribeMany(relays, filters, {
    onevent: onEvent
  });
  return { close: () => sub.close() };
}

export async function publishTo(relays: string[], event: NostrEvent) {
  const p = getPool();
  const results: { relay: string; ok: boolean; error?: any }[] = [];
  const promises = p.publish(relays, event);
  
  await Promise.all(promises.map(async (promise, index) => {
    try {
      await promise;
      results.push({ relay: relays[index], ok: true });
    } catch (e) {
      results.push({ relay: relays[index], ok: false, error: e });
    }
  }));
  
  return results;
}

export async function checkRelayHealth(url: string, timeoutMs = 1500) {
  try {
    const p = getPool();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    
    const sub = p.subscribeMany([url], [{ kinds: [0], limit: 1 }], {
      onevent: () => {
        clearTimeout(t);
        sub.close();
      },
      oneose: () => {
        clearTimeout(t);
        sub.close();
      }
    });
    
    await new Promise<void>((resolve, reject) => {
      controller.signal.addEventListener('abort', () => {
        sub.close();
        reject(new Error('timeout'));
      });
      setTimeout(resolve, 100); // Give it time to connect
    });
    
    return true;
  } catch {
    return false;
  }
}
