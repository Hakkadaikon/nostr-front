import { describe, it, expect } from 'vitest';
import { generatePrivateKey } from '../../../features/keys/generate';
import { nip19 } from 'nostr-tools';

describe('keys/generate', () => {
  it('generates valid hex and encodes npub/nsec', () => {
    const { hex, npub, nsec } = generatePrivateKey();
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
    const d1 = nip19.decode(npub);
    const d2 = nip19.decode(nsec);
    expect(d1.type).toBe('npub');
    expect(d2.type).toBe('nsec');
  });
});
