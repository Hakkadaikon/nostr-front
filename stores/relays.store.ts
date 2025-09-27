import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Relay = { url: string; read: boolean; write: boolean; nip50?: boolean };

type State = { 
  relays: Relay[];
} & {
  add: (url: string) => void;
  remove: (url: string) => void;
  toggleRead: (url: string) => void;
  toggleWrite: (url: string) => void;
  toggleNip50: (url: string) => void;
  getSearchRelays: () => string[];
};

const defaultRelays = [
  { url: 'wss://relay.damus.io', read: true, write: true, nip50: true },
  { url: 'wss://relay.nostr.band', read: false, write: false, nip50: true },
  { url: 'wss://relay.nostr.wine', read: false, write: false, nip50: true },
];

const envRelayUrls = (process.env.NEXT_PUBLIC_DEFAULT_RELAYS || '')
  .split(',')
  .map(url => url.trim())
  .filter((url): url is string => url.length > 0);

const envRelays: Relay[] = envRelayUrls.map(url => ({
  url,
  read: true,
  write: true,
  nip50: true,
}));

export const useRelaysStore = create<State>()(
  persist(
    (set, get) => ({
      relays: envRelays.length > 0 ? envRelays : defaultRelays,
      add: (url) => set({ relays: [...get().relays, { url, read: true, write: true, nip50: false }] }),
      remove: (url) => set({ relays: get().relays.filter(r => r.url !== url) }),
      toggleRead: (url) => set({ relays: get().relays.map(r => (r.url === url ? { ...r, read: !r.read } : r)) }),
      toggleWrite: (url) => set({ relays: get().relays.map(r => (r.url === url ? { ...r, write: !r.write } : r)) }),
      toggleNip50: (url) => set({ relays: get().relays.map(r => (r.url === url ? { ...r, nip50: !r.nip50 } : r)) }),
      getSearchRelays: () => {
        const state = get();
        // NIP-50対応のリレーのみを返す
        return state.relays.filter(r => r.nip50).map(r => r.url);
      },
    }),
    {
      name: 'nostr-relays-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: State | undefined, _version) => {
        if (!persistedState) return persistedState;
        const relays = (persistedState.relays || []).map((relay) => {
          if (relay.nip50) return relay;
          if (envRelayUrls.includes(relay.url)) {
            return { ...relay, nip50: true };
          }
          return { ...relay, nip50: relay.nip50 ?? false };
        });
        return { ...persistedState, relays };
      },
    }
  )
);
