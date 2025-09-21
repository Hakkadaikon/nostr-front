import { describe, it, expect } from 'vitest';
import { buildQuote, buildRepostTags } from '../../../lib/nostr/nip18';

describe('nip18', () => {
  it('builds repost tags', () => {
    const t = buildRepostTags('id', 'author');
    expect(t.find(x => x[0] === 'e')?.[1]).toBe('id');
    expect(t.find(x => x[0] === 'p')?.[1]).toBe('author');
  });
  it('builds quote content with nostr:nevent', () => {
    const q = buildQuote('id');
    expect(q.content.startsWith('nostr:')).toBe(true);
  });
});
