import { nip19, getPublicKey } from 'nostr-tools';

export function importKey(input: string) {
  try {
    if (input.startsWith('nsec1')) {
      const d = nip19.decode(input);
      const hex = d.data as string;
      const npub = nip19.npubEncode(getPublicKey(hex));
      return { ok: true, hex, npub, nsec: input };
    }
    // hex private key
    const hex = input.toLowerCase();
    const npub = nip19.npubEncode(getPublicKey(hex));
    const nsec = nip19.nsecEncode(hex);
    return { ok: true, hex, npub, nsec };
  } catch (e) {
    return { ok: false, error: e };
  }
}
