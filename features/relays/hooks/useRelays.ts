import type { Relay, RelayConfig } from '../types';
import { useState } from 'react';
import { DEFAULT_RELAYS } from '../../../lib/utils/constants';

export function useRelays(initial?: string[]): RelayConfig {
  const [relays, setRelays] = useState<Relay[]>(
    (initial || DEFAULT_RELAYS).map(url => ({ url, read: true, write: true }))
  );
  return {
    relays,
    add: (url: string) => setRelays(r => (r.find(x => x.url === url) ? r : [...r, { url, read: true, write: true }])),
    remove: (url: string) => setRelays(r => r.filter(x => x.url !== url)),
    toggleRead: (url: string) => setRelays(r => r.map(x => (x.url === url ? { ...x, read: !x.read } : x))),
    toggleWrite: (url: string) => setRelays(r => r.map(x => (x.url === url ? { ...x, write: !x.write } : x))),
  };
}
