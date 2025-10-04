import type { Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';

const DEFAULT_FALLBACK_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

function buildRelayList(preferred: string[] = []) {
  const relaysStore = useRelaysStore.getState();
  const configured = getReadRelays(relaysStore.relays) || [];

  const envRelays = (process.env.NEXT_PUBLIC_DEFAULT_RELAYS || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

  const combined = new Set<string>([
    ...preferred,
    ...configured,
    ...envRelays,
    ...DEFAULT_FALLBACK_RELAYS,
  ]);

  return Array.from(combined);
}

export async function fetchNote(eventId: string, relays?: string[], timeoutMs = 5000): Promise<NostrEvent | null> {
  const relayList = buildRelayList(relays);
  console.log('fetchNote: Fetching event', { eventId, relayList, timeoutMs });

  if (relayList.length === 0) {
    console.warn('fetchNote: No relays available');
    return null;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('fetchNote: Timeout reached for event', eventId);
        sub.close();
        resolve(null);
      }
    }, timeoutMs);

    const sub = subscribeTo(
      relayList,
      [{ ids: [eventId], limit: 1 }],
      (event) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        console.log('fetchNote: Successfully fetched event', { eventId, event });
        sub.close();
        resolve(event);
      },
      {
        onEose: () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          console.log('fetchNote: EOSE without event', { eventId });
          sub.close();
          resolve(null);
        }
      }
    );
  });
}
