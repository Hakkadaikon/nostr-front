import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nip19, getPublicKey } from 'nostr-tools';

export type AuthState = {
  hasNip07: boolean;
  locked: boolean;
  npub: string | null;
  nsec?: string | null;
  publicKey: string | null; // hex public key
  pubkey?: string | null; // alias for publicKey (for compatibility)
  saveNsecEnabled: boolean; // ユーザーがnsec保存を有効にしたか
};

type Actions = {
  setHasNip07: (v: boolean) => void;
  lock: () => void;
  unlock: () => void;
  loginWithNsec: (npub: string, nsec: string) => void;
  logout: () => void;
  enableNsecSaving: (enabled: boolean) => void;
  restoreFromStorage: () => boolean;
};

export const useAuthStore = create<AuthState & Actions>()(
  persist(
    (set, get) => ({
  hasNip07: false,
  locked: false, // デフォルトでアンロック状態
  npub: null,
  nsec: null,
  publicKey: null,
  pubkey: null,
  saveNsecEnabled: true, // デフォルトで保存を有効に
  setHasNip07: (v) => set({ hasNip07: v }),
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  loginWithNsec: (npub, nsec) => {
    try {
      // 入力検証
      if (!npub || !nsec) {
        throw new Error('Invalid credentials');
      }

      // npubをデコードしてpublicKeyを取得
      const { type, data } = nip19.decode(npub);
      if (type === 'npub') {
        const pubkey = data as string;
        set({ npub, nsec, publicKey: pubkey, pubkey, locked: false });
        console.log('[loginWithNsec] Logged in successfully');
      } else {
        throw new Error('Invalid npub format');
      }
    } catch (error) {
      console.error('Failed to login:', error);
      // エラー時は認証状態をクリア
      set({ npub: null, nsec: null, publicKey: null, pubkey: null, locked: true });
    }
  },
  logout: () => {
    set({ npub: null, nsec: null, publicKey: null, pubkey: null, locked: true });
    console.log('[logout] Logged out');
  },
  enableNsecSaving: (enabled) => {
    set({ saveNsecEnabled: enabled });
    console.log(`[enableNsecSaving] Nsec saving ${enabled ? 'enabled' : 'disabled'}`);
  },
  restoreFromStorage: () => {
    try {
      const state = get();
      // 保存された認証情報がある場合は復元
      if (state.nsec && state.npub) {
        console.log('[restoreFromStorage] Restoring saved credentials');
        set({ locked: false });
        return true;
      }
      // 保存された認証情報がない場合は新しい鍵を自動生成
      console.log('[restoreFromStorage] No saved credentials, generating new keys');
      const { generatePrivateKey, getPublicKey } = require('nostr-tools');
      const sk = generatePrivateKey();
      const pk = getPublicKey(sk);
      const nsec = nip19.nsecEncode(sk);
      const npub = nip19.npubEncode(pk);

      set({
        nsec,
        npub,
        publicKey: pk,
        pubkey: pk,
        locked: false,
        saveNsecEnabled: true // 自動生成時は保存を有効に
      });

      console.log('[restoreFromStorage] Generated new keys');
      return true;
    } catch (error) {
      console.error('[restoreFromStorage] Failed:', error);
      return false;
    }
  },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        npub: state.npub,
        publicKey: state.publicKey,
        pubkey: state.pubkey,
        locked: state.locked,
        saveNsecEnabled: state.saveNsecEnabled,
        // nsecは保存が有効な場合のみ保存（nostterと同じ方式）
        nsec: state.saveNsecEnabled ? state.nsec : undefined,
      }),
    }
  )
);

