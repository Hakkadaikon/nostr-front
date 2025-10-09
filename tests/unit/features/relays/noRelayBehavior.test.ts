import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  configurable: true,
});

let fetchTimeline: typeof import('../../../../features/timeline/services/timeline').fetchTimeline;
let fetchNote: typeof import('../../../../features/notes/fetchNote').fetchNote;
let fetchFollowList: typeof import('../../../../features/follow/services/follow').fetchFollowList;
let fetchFollowLists: typeof import('../../../../features/follow/services/follow').fetchFollowLists;
let useRelaysStore: typeof import('../../../../stores/relays.store').useRelaysStore;

describe('Relay usage when none configured', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_DEFAULT_RELAYS = '';

    ({ fetchTimeline } = await import('../../../../features/timeline/services/timeline'));
    ({ fetchNote } = await import('../../../../features/notes/fetchNote'));
    ({ fetchFollowList, fetchFollowLists } = await import('../../../../features/follow/services/follow'));
    ({ useRelaysStore } = await import('../../../../stores/relays.store'));
  });

  beforeEach(() => {
    useRelaysStore.setState({ relays: [] });
  });

  it('returns explicit error for timeline fetch', async () => {
    const result = await fetchTimeline({ type: 'home' });

    expect(result.tweets).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.error?.code).toBe('NO_RELAYS_CONFIGURED');
  });

  it('returns null for note fetch', async () => {
    const note = await fetchNote('dummy-note-id');
    expect(note).toBeNull();
  });

  it('returns empty list for follow list when no relays', async () => {
    const followList = await fetchFollowList('dummy-pubkey');
    expect(followList).toEqual([]);
  });

  it('returns empty map for bulk follow lists when no relays', async () => {
    const followMap = await fetchFollowLists(['dummy-pubkey']);
    expect(followMap).toBeInstanceOf(Map);
    expect(followMap.size).toBe(0);
  });
});
