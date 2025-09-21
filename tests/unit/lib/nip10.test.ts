import { describe, it, expect } from 'vitest';
import { buildReplyTags, extractMarkers } from '../../../lib/nostr/nip10';

describe('nip10', () => {
  it('builds root/reply markers and p tags', () => {
    const tags = buildReplyTags({ rootId: 'r', replyToId: 'c', rootAuthor: 'a1', replyAuthor: 'a2' });
    const markers = extractMarkers(tags);
    expect(markers.root).toBe('r');
    expect(markers.reply).toBe('c');
  });
});
