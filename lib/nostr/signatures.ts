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
    // 秘密鍵を取得して確認
    let secretKeyValue: string | Uint8Array | undefined;
    if (getSecretKey) {
      secretKeyValue = typeof getSecretKey === 'function' ? await getSecretKey() : getSecretKey;
    }

    const hasValidSecretKey = secretKeyValue && secretKeyValue !== '' &&
      (typeof secretKeyValue === 'string' || secretKeyValue instanceof Uint8Array);

    console.log('[signEvent] Secret key check', {
      hasSecretKey: !!getSecretKey,
      hasValidSecretKey,
      type: secretKeyValue ? typeof secretKeyValue : 'none',
      length: secretKeyValue ? (typeof secretKeyValue === 'string' ? secretKeyValue.length : secretKeyValue.byteLength) : 0,
      hasNip07: hasNip07()
    });

    // NIP-07が利用可能で、有効な秘密鍵がない場合は拡張機能を使用
    if (hasNip07() && !hasValidSecretKey) {
      try {
        console.log('[signEvent] Attempting to sign with NIP-07 extension...');
        const nostr = (globalThis as any).nostr;
        const signed = await nostr.signEvent(event);
        // some providers may not set id
        signed.id = signed.id || getEventHash(signed);
        console.log('[signEvent] Successfully signed with NIP-07');
        return signed as NostrEvent;
      } catch (error) {
        console.error('[signEvent] NIP-07 signing failed:', error);
        throw new Error('NIP-07 signing failed. Please check your Nostr extension.');
      }
    }

    // 秘密鍵による署名
    if (!hasValidSecretKey) {
      console.warn('[signEvent] No valid secret key provided');
      if (!hasNip07()) {
        throw new Error('No signing method available. Please install a Nostr extension or provide a secret key.');
      }
      throw new Error('No valid secret key provided. Please log in again with your nsec.');
    }

    try {
      const skInput = secretKeyValue!; // すでに取得済みなので使用

      console.log('[signEvent] Attempting to sign with secret key...');
      const skBytes = normalizeSecretKey(skInput as any);
      console.log('[signEvent] Secret key normalized, bytes length:', skBytes.byteLength);

      const e: any = { ...event };
      if (!e.pubkey) {
        e.pubkey = getPublicKey(skBytes);
        console.log('[signEvent] Generated pubkey:', e.pubkey);
      }

      const signed = finalizeEvent(e, skBytes);
      signed.id = (signed as any).id || getEventHash(signed as any);
      console.log('[signEvent] Successfully signed with secret key, event ID:', signed.id);
      return signed as NostrEvent;
    } catch (error) {
      console.error('[signEvent] Secret key signing failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('Unsupported secret key')) {
          throw new Error('Invalid secret key format. Please check your nsec or hex private key.');
        }
        if (error.message.includes('bad scalar size')) {
          throw new Error('秘密鍵の形式が正しくありません。nsec1で始まる秘密鍵を使用してください。');
        }
        throw new Error(`署名エラー: ${error.message}`);
      }
      throw error;
    }
  });
  return queue;
}

export function verify(event: NostrEvent) {
  return validateEvent(event) && verifyEvent(event);
}
