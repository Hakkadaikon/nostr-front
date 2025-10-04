import { describe, it, expect } from 'vitest';
import { eventToUser } from '../../../../features/search/services/nostrSearch';
import type { Event as NostrEvent } from 'nostr-tools';

describe('eventToUser', () => {
  it('converts kind 0 event to User', () => {
    const event: NostrEvent = {
      id: 'event123',
      pubkey: 'abc123',
      created_at: 1234567890,
      kind: 0,
      tags: [],
      content: JSON.stringify({
        name: 'Alice',
        display_name: 'Alice Wonderland',
        about: 'Hello world',
        picture: 'https://example.com/avatar.jpg',
      }),
      sig: 'sig123',
    };

    const user = eventToUser(event);

    expect(user).not.toBeNull();
    expect(user?.id).toBe('abc123');
    expect(user?.username).toBe('Alice');
    expect(user?.name).toBe('Alice Wonderland');
    expect(user?.bio).toBe('Hello world');
  });

  it('returns null for non-kind-0 events', () => {
    const event: NostrEvent = {
      id: 'event123',
      pubkey: 'abc123',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'Hello',
      sig: 'sig123',
    };

    const user = eventToUser(event);

    expect(user).toBeNull();
  });

  it('handles missing profile fields gracefully', () => {
    const event: NostrEvent = {
      id: 'event123',
      pubkey: 'abc123',
      created_at: 1234567890,
      kind: 0,
      tags: [],
      content: JSON.stringify({}),
      sig: 'sig123',
    };

    const user = eventToUser(event);

    expect(user).not.toBeNull();
    expect(user?.username).toMatch(/^nostr:/);
    expect(user?.name).toBe('');
    expect(user?.bio).toBe('');
  });

  it('handles invalid JSON gracefully', () => {
    const event: NostrEvent = {
      id: 'event123',
      pubkey: 'abc123',
      created_at: 1234567890,
      kind: 0,
      tags: [],
      content: 'not valid json',
      sig: 'sig123',
    };

    const user = eventToUser(event);

    expect(user).toBeNull();
  });
});
