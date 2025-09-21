import { create } from 'zustand';

export type AuthState = {
  hasNip07: boolean;
  locked: boolean;
  npub: string | null;
  nsec?: string | null; // keep in-memory only
};

type Actions = {
  setHasNip07: (v: boolean) => void;
  lock: () => void;
  unlock: () => void;
  loginWithNsec: (npub: string, nsec: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState & Actions>((set) => ({
  hasNip07: false,
  locked: true,
  npub: null,
  nsec: null,
  setHasNip07: (v) => set({ hasNip07: v }),
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  loginWithNsec: (npub, nsec) => set({ npub, nsec, locked: false }),
  logout: () => set({ npub: null, nsec: null, locked: true }),
}));
