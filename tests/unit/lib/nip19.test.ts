import { describe, it, expect } from 'vitest';
import { encodeNote, decode, encodeNpub } from '../../../lib/nostr/nip19';

describe('nip19', () => {
  it('encodes and decodes npub and note', () => {
    // fake hex id/pubkey lengths to assert wrappers work (nip19 will throw if invalid)
    const hex = '0'.repeat(64);
    const note = encodeNote(hex);
    const npub = encodeNpub(hex);
    expect(decode(note).type).toBe('note');
    expect(decode(npub).type).toBe('npub');
  });
});
