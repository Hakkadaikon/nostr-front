import { describe, it, expect } from 'vitest';
import { isHex, isNostrUri } from '../../../lib/utils/validators';
import { encodeNote } from '../../../lib/nostr/nip19';

describe('validators', () => {
  it('hex check works', () => {
    expect(isHex('0abc')).toBe(true);
    expect(isHex('xyz')).toBe(false);
  });
  it('nostr uri check works with valid bech32 payload', () => {
    const note = encodeNote('0'.repeat(64));
    expect(isNostrUri(`nostr:${note}`)).toBe(true);
    expect(isNostrUri('http://example.com')).toBe(false);
  });
});
