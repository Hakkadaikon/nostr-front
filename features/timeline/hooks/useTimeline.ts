"use client";
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useEffect, useState } from 'react';
import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { dedupePush } from '../services/timeline';

export function useTimeline(filters?: Filter[]) {
  const relays = useRelaysStore(s => s.relays.filter(r => r.read).map(r => r.url));
  const [events, setEvents] = useState<NostrEvent[]>([]);
  useEffect(() => {
    if (!relays.length) return;
    const sub = subscribe(relays, filters || [{ kinds: [1, 6], limit: 50 }], e => {
      setEvents(prev => dedupePush(prev, e));
    });
    return () => sub.close();
  }, [JSON.stringify(relays), JSON.stringify(filters)]);
  return { events };
}
