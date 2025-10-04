import { describe, it, expect } from 'vitest';
import { createNip50Filter } from '../../../../features/search/services/nostrSearch';

describe('createNip50Filter', () => {
  it('creates user search filter with kind 0', () => {
    const filters = createNip50Filter('alice', 'users');

    expect(filters).toHaveLength(1);
    expect(filters[0]).toMatchObject({
      search: 'alice',
      kinds: [0],
      limit: 50,
    });
  });

  it('creates tweet search filter with kind 1', () => {
    const filters = createNip50Filter('hello world', 'tweets');

    expect(filters).toHaveLength(1);
    expect(filters[0]).toMatchObject({
      search: 'hello world',
      kinds: [1],
      limit: 50,
    });
  });

  it('handles empty query', () => {
    const filters = createNip50Filter('', 'users');

    expect(filters).toHaveLength(1);
    expect(filters[0].search).toBe('');
  });

  it('handles special characters in query', () => {
    const filters = createNip50Filter('#nostr @alice', 'tweets');

    expect(filters).toHaveLength(1);
    expect(filters[0].search).toBe('#nostr @alice');
  });
});
