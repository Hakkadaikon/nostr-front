import { create } from 'zustand';

type Relay = { url: string; read: boolean; write: boolean };

type State = { relays: Relay[] } & {
  add: (url: string) => void;
  remove: (url: string) => void;
  toggleRead: (url: string) => void;
  toggleWrite: (url: string) => void;
};

export const useRelaysStore = create<State>((set, get) => ({
  relays: (process.env.NEXT_PUBLIC_DEFAULT_RELAYS?.split(',') || []).map(url => ({ url, read: true, write: true })),
  add: (url) => set({ relays: [...get().relays, { url, read: true, write: true }] }),
  remove: (url) => set({ relays: get().relays.filter(r => r.url !== url) }),
  toggleRead: (url) => set({ relays: get().relays.map(r => (r.url === url ? { ...r, read: !r.read } : r)) }),
  toggleWrite: (url) => set({ relays: get().relays.map(r => (r.url === url ? { ...r, write: !r.write } : r)) }),
}));
