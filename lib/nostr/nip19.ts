import { nip19 } from 'nostr-tools';

export type NKind = 'npub' | 'nsec' | 'note' | 'nevent';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function encodeNpub(hexPubkey: string) {
  return nip19.npubEncode(hexPubkey);
}
export function encodeNsec(hexSec: string) {
  return nip19.nsecEncode(hexToBytes(hexSec));
}
export function encodeNote(hexEventId: string) {
  return nip19.noteEncode(hexEventId);
}
export function encodeNevent(hexEventId: string, relays?: string[], author?: string) {
  return nip19.neventEncode({ id: hexEventId, relays, author });
}

export function decode(bech32: string) {
  return nip19.decode(bech32);
}

export function isBech32Of(bech32: string, kinds: NKind[]) {
  try {
    const d = nip19.decode(bech32);
    return kinds.includes(d.type as NKind);
  } catch {
    return false;
  }
}
