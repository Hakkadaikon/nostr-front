import { decode, encodeNevent } from '../nostr/nip19';

export type NostrUri = { type: 'npub' | 'nsec' | 'note' | 'nevent' | 'nprofile'; data: any };

export function parseNostrUri(input: string): NostrUri | null {
  if (!input?.startsWith('nostr:')) return null;
  const bech = input.slice('nostr:'.length);
  try {
    const d = decode(bech);
    return { type: d.type as any, data: d.data };
  } catch {
    return null;
  }
}

export function toNostrEventUri(eventId: string, relays?: string[], author?: string) {
  return `nostr:${encodeNevent(eventId, relays, author)}`;
}

// naive linkify: return original for now; implement richer parsing later
export function linkifyNostr(input: string) {
  return input;
}
