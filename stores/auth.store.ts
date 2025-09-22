import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nip19 } from 'nostr-tools';

export type AuthState = {
  hasNip07: boolean;
  locked: boolean;
  npub: string | null;
  nsec?: string | null; // keep in-memory only
  publicKey: string | null; // hex public key
  pubkey?: string | null; // alias for publicKey (for compatibility)
};

type Actions = {
  setHasNip07: (v: boolean) => void;
  lock: () => void;
  unlock: () => void;
  loginWithNsec: (npub: string, nsec: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState & Actions>()(
  persist(
    (set, get) => ({
  hasNip07: false,
  locked: true,
  npub: null,
  nsec: null,
  publicKey: null,
  pubkey: null,
  setHasNip07: (v) => set({ hasNip07: v }),
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  loginWithNsec: (npub, nsec) => {
    try {
      // npubをデコードしてpublicKeyを取得
      const { type, data } = nip19.decode(npub);
      if (type === 'npub') {
        const pubkey = data as string;
        set({ npub, nsec, publicKey: pubkey, pubkey, locked: false });
      } else {
        console.error('Invalid npub format');
        set({ npub, nsec, locked: false });
      }
    } catch (error) {
      console.error('Failed to decode npub:', error);
      set({ npub, nsec, locked: false });
    }
  },
  logout: () => set({ npub: null, nsec: null, publicKey: null, pubkey: null, locked: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Do not persist secrets or environment flags
        npub: state.npub,
        publicKey: state.publicKey,
        pubkey: state.pubkey,
        locked: state.locked,
      }),
    }
  )
);

