import { finalizeEvent, getEventHash, validateEvent, verifyEvent, getPublicKey, nip19, type Event as NostrEvent } from 'nostr-tools';

let queue: Promise<any> = Promise.resolve();

export function hasNip07() {
  return typeof (globalThis as any).nostr !== 'undefined';
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.toLowerCase();
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

function normalizeSecretKey(sk: string | Uint8Array): Uint8Array {
  if (sk instanceof Uint8Array) return sk;
  if (typeof sk === 'string') {
    const s = sk.trim();
    if (s.startsWith('nsec1')) {
      const d = nip19.decode(s);
      return d.data as Uint8Array;
    }
    if (/^[0-9a-fA-F]{64}$/.test(s)) {
      return hexToBytes(s);
    }
    throw new Error('Unsupported secret key format');
  }
  throw new Error('Unsupported secret key type');
}

export async function signEvent(event: Omit<NostrEvent, 'id' | 'sig'>, getSecretKey?: () => Promise<string | Uint8Array> | string | Uint8Array): Promise<NostrEvent> {
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
    const skInput = typeof getSecretKey === 'function' ? await getSecretKey() : getSecretKey;
    const skBytes = normalizeSecretKey(skInput as any);
    const e: any = { ...event };
    if (!e.pubkey) e.pubkey = getPublicKey(skBytes);
    const signed = finalizeEvent(e, skBytes);
    signed.id = (signed as any).id || getEventHash(signed as any);
    return signed as NostrEvent;
  });
  return queue;
}

export function verify(event: NostrEvent) {
  return validateEvent(event) && verifyEvent(event);
}
