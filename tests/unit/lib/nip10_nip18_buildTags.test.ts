import { describe, it, expect } from 'vitest';
import { buildReplyTags } from '../../../lib/nostr/nip10';
import { buildRepostTags, buildQuote } from '../../../lib/nostr/nip18';

describe('tag builders', () => {
  it('builds reply tags with markers', () => {
    const tags = buildReplyTags({ rootId: 'root', replyToId: 'child', rootAuthor: 'a1', replyAuthor: 'a2' });
    expect(tags.find(t => t[0]==='e' && t[3]==='root')?.[1]).toBe('root');
    expect(tags.find(t => t[0]==='e' && t[3]==='reply')?.[1]).toBe('child');
  });
  it('builds repost tags', () => {
    const tags = buildRepostTags('id','author',['wss://r']);
    expect(tags.find(t=>t[0]==='e')?.[1]).toBe('id');
    expect(tags.find(t=>t[0]==='p')?.[1]).toBe('author');
  });
  it('builds quote content with nevent link', () => {
    const q = buildQuote('id',['wss://r'],'author');
    expect(q.content.startsWith('nostr:')).toBe(true);
  });
});
