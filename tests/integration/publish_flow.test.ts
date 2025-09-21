import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/nostr/client', async () => {
  return {
    publish: vi.fn(async (_relays: string[], _event: any) => [{ relay: 'wss://mock', ok: true }]),
  };
});

vi.mock('../../lib/nostr/signatures', async () => {
  const mod = await vi.importActual<any>('../../lib/nostr/signatures');
  return {
    ...mod,
    signEvent: vi.fn(async (e: any) => ({ id: 'id', sig: 'sig', ...e })),
    verify: vi.fn(() => true),
  };
});

describe('integration publish flow', () => {
  beforeEach(() => {
    // set relays store state
    const { useRelaysStore } = require('../../stores/relays.store');
    useRelaysStore.setState({ relays: [{ url: 'wss://mock', read: true, write: true }] });
  });
  it('publishes a note to write relays', async () => {
    const { publishNote } = await import('../../features/notes/publish');
    const res = await publishNote('hello world');
    expect(res.ok).toBe(true);
    expect(res.results[0].relay).toBe('wss://mock');
  });
});
