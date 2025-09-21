import { nip19 } from 'nostr-tools';

export type NKind = 'npub' | 'nsec' | 'note' | 'nevent';

export function encodeNpub(hexPubkey: string) {
  return nip19.npubEncode(hexPubkey);
}
export function encodeNsec(hexSec: string) {
  return nip19.nsecEncode(hexSec);
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
