import { finalizeEvent, getEventHash, validateEvent, verifyEvent, type Event as NostrEvent } from 'nostr-tools';

let queue: Promise<any> = Promise.resolve();

export function hasNip07() {
  return typeof (globalThis as any).nostr !== 'undefined';
}

export async function signEvent(event: Omit<NostrEvent, 'id' | 'sig'>, getSecretKey?: () => Promise<string> | string): Promise<NostrEvent> {
  // serialize sign requests to avoid multiple prompts
  queue = queue.then(async () => {
    if (hasNip07()) {
      const nostr = (globalThis as any).nostr;
      const signed = await nostr.signEvent(event);
      // some providers may not set id
      signed.id = signed.id || getEventHash(signed);
      return signed as NostrEvent;
    }
    if (!getSecretKey) throw new Error('No NIP-07 and no secret key provided');
    const sk = typeof getSecretKey === 'function' ? await getSecretKey() : getSecretKey;
    const skBytes = new TextEncoder().encode(sk);
    const signed = finalizeEvent(event as any, skBytes);
    return signed as NostrEvent;
  });
  return queue;
}

export function verify(event: NostrEvent) {
  return validateEvent(event) && verifyEvent(event);
}
