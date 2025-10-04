import { describe, it, expect } from 'vitest';
import { eventToTweet } from '../../../../features/search/services/nostrSearch';
import type { Event as NostrEvent } from 'nostr-tools';
import type { User } from '../../../../features/timeline/types';

describe('eventToTweet', () => {
  const mockAuthor: User = {
    id: 'author123',
    username: 'alice',
    name: 'Alice',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Hello',
    followersCount: 100,
    followingCount: 50,
    createdAt: new Date(),
  };

  it('converts kind 1 event to Tweet', () => {
    const event: NostrEvent = {
      id: 'tweet123',
      pubkey: 'author123',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'Hello world!',
      sig: 'sig123',
    };

    const tweet = eventToTweet(event, mockAuthor);

    expect(tweet).not.toBeNull();
    expect(tweet?.id).toBe('tweet123');
    expect(tweet?.content).toBe('Hello world!');
    expect(tweet?.author).toBe(mockAuthor);
  });

  it('returns null for non-kind-1 events', () => {
    const event: NostrEvent = {
      id: 'event123',
      pubkey: 'author123',
      created_at: 1234567890,
      kind: 0,
      tags: [],
      content: JSON.stringify({ name: 'Alice' }),
      sig: 'sig123',
    };

    const tweet = eventToTweet(event, mockAuthor);

    expect(tweet).toBeNull();
  });

  it('creates placeholder author when author is not provided', () => {
    const event: NostrEvent = {
      id: 'tweet123',
      pubkey: 'unknown123',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'Anonymous tweet',
      sig: 'sig123',
    };

    const tweet = eventToTweet(event);

    expect(tweet).not.toBeNull();
    expect(tweet?.author.id).toBe('unknown123');
    expect(tweet?.author.username).toMatch(/^nostr:/);
    expect(tweet?.author.name).toBe('');
  });

  it('includes stats when provided', () => {
    const event: NostrEvent = {
      id: 'tweet123',
      pubkey: 'author123',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'Popular tweet',
      sig: 'sig123',
    };

    const stats = {
      likesCount: 10,
      repostsCount: 5,
      repliesCount: 3,
      zapsCount: 2,
    };

    const tweet = eventToTweet(event, mockAuthor, stats);

    expect(tweet).not.toBeNull();
    expect(tweet?.likesCount).toBe(10);
    expect(tweet?.retweetsCount).toBe(5);
    expect(tweet?.repliesCount).toBe(3);
    expect(tweet?.zapsCount).toBe(2);
  });

  it('defaults stats to 0 when not provided', () => {
    const event: NostrEvent = {
      id: 'tweet123',
      pubkey: 'author123',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'New tweet',
      sig: 'sig123',
    };

    const tweet = eventToTweet(event, mockAuthor);

    expect(tweet).not.toBeNull();
    expect(tweet?.likesCount).toBe(0);
    expect(tweet?.retweetsCount).toBe(0);
    expect(tweet?.repliesCount).toBe(0);
    expect(tweet?.zapsCount).toBe(0);
  });
});
