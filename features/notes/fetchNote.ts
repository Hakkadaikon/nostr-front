import type { Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';

function buildRelayList(preferred: string[] = []) {
  const relaysStore = useRelaysStore.getState();
  const configured = getReadRelays(relaysStore.relays) || [];

  const combined = new Set<string>([
    ...preferred,
    ...configured,
  ]);

  return Array.from(combined);
}

export async function fetchNote(eventId: string, relays?: string[], timeoutMs = 5000): Promise<NostrEvent | null> {
  const relayList = buildRelayList(relays);

  if (relayList.length === 0) {
    return null;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
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
        sub.close();
        resolve(event);
      },
      {
        onEose: () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          sub.close();
          resolve(null);
        }
      }
    );
  });
}
