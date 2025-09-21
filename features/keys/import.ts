import { nip19, getPublicKey } from 'nostr-tools';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function importKey(input: string) {
  try {
    if (input.startsWith('nsec1')) {
      const d = nip19.decode(input);
      const sk = d.data as Uint8Array;
      const hex = Array.from(sk).map(b => b.toString(16).padStart(2, '0')).join('');
      const npub = nip19.npubEncode(getPublicKey(sk));
      return { ok: true, hex, npub, nsec: input };
    }
    // hex private key
    const hex = input.toLowerCase();
    const sk = hexToBytes(hex);
    const npub = nip19.npubEncode(getPublicKey(sk));
    const nsec = nip19.nsecEncode(sk);
    return { ok: true, hex, npub, nsec };
  } catch (e) {
    return { ok: false, error: e };
  }
}
