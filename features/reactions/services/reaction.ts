import type { Event as NostrEvent } from 'nostr-tools';
import { KIND_REACTION, KIND_DELETE } from '../../../lib/nostr/constants';
import { getWriteRelays, getReadRelays, subscribeTo } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';
import { signEvent, hasNip07 } from '../../../lib/nostr/signatures';
import { publish } from '../../../lib/nostr/client';

function requireSigningCapability() {
  const authStore = useAuthStore.getState();
  if (!authStore.nsec && !hasNip07()) {
    throw new Error('No signing method available');
  }
}

function getSecretKey() {
  const { nsec } = useAuthStore.getState();
  return nsec || '';
}

export async function createReaction(eventId: string, authorPubkey: string): Promise<NostrEvent> {
  requireSigningCapability();
  const authStore = useAuthStore.getState();

  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KIND_REACTION,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', eventId],
      ['p', authorPubkey],
    ],
    content: '+',
    ...(authStore.publicKey ? { pubkey: authStore.publicKey } : {}),
  } as Omit<NostrEvent, 'id' | 'sig'>;

  const signedEvent = await signEvent(unsigned, getSecretKey);

  const relaysStore = useRelaysStore.getState();
  const writeRelays = getWriteRelays(relaysStore.relays);
  if (writeRelays.length === 0) {
    throw new Error('No write relays configured');
  }

  await publish(writeRelays, signedEvent);

  return signedEvent;
}

export async function deleteReaction(reactionEventId: string): Promise<NostrEvent> {
  requireSigningCapability();
  const authStore = useAuthStore.getState();

  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KIND_DELETE,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', reactionEventId]],
    content: '',
    ...(authStore.publicKey ? { pubkey: authStore.publicKey } : {}),
  } as Omit<NostrEvent, 'id' | 'sig'>;

  const signedEvent = await signEvent(unsigned, getSecretKey);

  const relaysStore = useRelaysStore.getState();
  const writeRelays = getWriteRelays(relaysStore.relays);
  if (writeRelays.length === 0) {
    throw new Error('No write relays configured');
  }

  await publish(writeRelays, signedEvent);

  return signedEvent;
}

export async function getMyReaction(eventId: string): Promise<NostrEvent | null> {
  const authStore = useAuthStore.getState();
  const { publicKey } = authStore;

  if (!publicKey) {
    return null;
  }

  const relaysStore = useRelaysStore.getState();
  const readRelays = getReadRelays(relaysStore.relays);

  return new Promise((resolve) => {
    let reaction: NostrEvent | null = null;
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      readRelays,
      [{
        kinds: [KIND_REACTION],
        authors: [publicKey],
        '#e': [eventId],
        limit: 1,
      }],
      (event: NostrEvent) => {
        if (event.content === '+') {
          reaction = event;
          clearTimeout(timeoutId);
          sub.close();
          resolve(reaction);
        }
      }
    );

    timeoutId = setTimeout(() => {
      sub.close();
      resolve(null);
    }, 1000);
  });
}
