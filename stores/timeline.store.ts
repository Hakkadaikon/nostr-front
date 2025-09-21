import { create } from 'zustand';
import type { Event as NostrEvent } from 'nostr-tools';

type State = {
  byId: Record<string, NostrEvent>;
  order: string[]; // latest first
  upsert: (e: NostrEvent) => void;
};

export const useTimelineStore = create<State>((set, get) => ({
  byId: {},
  order: [],
  upsert: (e) => set(() => {
    const byId = { ...get().byId, [e.id]: e };
    const order = [e.id, ...get().order.filter(id => id !== e.id)];
    return { byId, order };
  }),
}));
