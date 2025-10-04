"use client";
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useRelaysStore } from '../../../stores/relays.store';
import { fetchRelayListForPubkey } from '../services/relayList';

/**
 * Load relay list from NIP-65 (kind:10002) for the current user and set into the relay store.
 * - Runs once when pubkey becomes available
 * - Preserves existing nip50 flags for matching URLs
 */
export function useLoadNip65Relays() {
  const pubkey = useAuthStore(s => s.publicKey);
  const relaysState = useRelaysStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!pubkey || initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        const fetched = await fetchRelayListForPubkey(pubkey);
        if (!fetched || fetched.length === 0) return;
        // preserve nip50 flags
        const existing = relaysState.relays;
        const next = fetched.map(fr => {
          const match = existing.find(e => e.url === fr.url);
          return { url: fr.url, read: fr.read, write: fr.write, nip50: match?.nip50 ?? false };
        });
        // If some existing URLs are not in fetched list, keep them? Requirement says to set from kind:10002, so replace.
        useRelaysStore.setState({ relays: next });
      } catch (e) {
      }
    })();
  }, [pubkey]);
}
