import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nip19, getPublicKey } from 'nostr-tools';
import { saveEncryptedNsec, loadEncryptedNsec, removeEncryptedNsec, clearSensitiveString } from '../lib/crypto/keyStorage';
import { secureLog, securityLog } from '../lib/utils/secureLogger';

export type AuthState = {
  hasNip07: boolean;
  locked: boolean;
  npub: string | null;
  nsec?: string | null; // メモリ内でのみ保持、永続化しない
  publicKey: string | null; // hex public key
  pubkey?: string | null; // alias for publicKey (for compatibility)
  saveNsecEnabled: boolean; // ユーザーが暗号化保存を有効にしたか
};

type Actions = {
  setHasNip07: (v: boolean) => void;
  lock: () => void;
  unlock: () => void;
  loginWithNsec: (npub: string, nsec: string) => void;
  logout: () => void;
  enableNsecSaving: (enabled: boolean) => void;
  restoreFromStorage: () => Promise<boolean>;
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
      saveNsecEnabled: true, // デフォルトで暗号化保存を有効に
      
      setHasNip07: (v) => set({ hasNip07: v }),
      
      lock: () => {
        const state = get();
        // メモリクリア（セッション管理は削除）
        if (state.nsec) {
          clearSensitiveString(state.nsec);
        }
        set({ locked: true, nsec: null });
      },
      
      unlock: () => set({ locked: false }),
      
      loginWithNsec: async (npub, nsec) => {
        try {
          // 入力検証
          if (!npub || !nsec) {
            throw new Error('Invalid credentials');
          }

          // npubをデコードしてpublicKeyを取得
          const { type, data } = nip19.decode(npub);
          if (type === 'npub') {
            const pubkey = data as string;
            
            // 状態を更新（sessionActiveは削除）
            set({ 
              npub, 
              nsec, // メモリ内でのみ保持
              publicKey: pubkey, 
              pubkey, 
              locked: false
            });
            
            // 暗号化保存が有効な場合、秘密鍵を暗号化して保存
            const state = get();
            if (state.saveNsecEnabled) {
              try {
                await saveEncryptedNsec(pubkey, nsec);
                secureLog.info('[loginWithNsec] Private key encrypted and stored');
              } catch (error) {
                secureLog.warn('[loginWithNsec] Failed to encrypt and store private key:', error);
              }
            }
            
            securityLog('User login', { npub: npub.substring(0, 10) + '...' });
            secureLog.info('[loginWithNsec] Logged in successfully with persistent encrypted storage');
          } else {
            throw new Error('Invalid npub format');
          }
        } catch (error) {
          secureLog.error('Failed to login:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          securityLog('Login failed', { error: errorMessage });
          // エラー時は認証状態をクリア
          set({ 
            npub: null, 
            nsec: null, 
            publicKey: null, 
            pubkey: null, 
            locked: true
          });
          throw error;
        }
      },
      
      logout: () => {
        const state = get();
        
        // 機密データをメモリからクリア
        if (state.nsec) {
          clearSensitiveString(state.nsec);
        }
        
        // 暗号化保存されたデータも削除
        if (state.publicKey) {
          removeEncryptedNsec(state.publicKey);
        }
        
        set({ 
          npub: null, 
          nsec: null, 
          publicKey: null, 
          pubkey: null, 
          locked: true
        });
        
        securityLog('User logout', { voluntary: true });
        secureLog.info('[logout] Logged out and cleared sensitive data');
      },
      
      enableNsecSaving: async (enabled) => {
        const state = get();
        set({ saveNsecEnabled: enabled });
        
        if (enabled && state.nsec && state.publicKey) {
          // 暗号化保存を有効にした場合、現在の秘密鍵を保存
          try {
            await saveEncryptedNsec(state.publicKey, state.nsec);
            secureLog.info('[enableNsecSaving] Private key encrypted and stored');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            secureLog.error('[enableNsecSaving] Failed to encrypt and store:', errorMessage);
          }
        } else if (!enabled && state.publicKey) {
          // 暗号化保存を無効にした場合、保存されたデータを削除
          removeEncryptedNsec(state.publicKey);
          secureLog.info('[enableNsecSaving] Encrypted storage disabled and data removed');
        }
      },
      
      restoreFromStorage: async () => {
        try {
          const state = get();
          
          // まず既存の保存された認証情報を確認
          if (state.npub && state.publicKey && state.saveNsecEnabled) {
            try {
              // 暗号化された秘密鍵を復号化して復元
              const decryptedNsec = await loadEncryptedNsec(state.publicKey);
              if (decryptedNsec) {
                set({ 
                  nsec: decryptedNsec,
                  locked: false
                });
                
                secureLog.info('[restoreFromStorage] Restored encrypted credentials');
                return true;
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              secureLog.warn('[restoreFromStorage] Failed to restore encrypted credentials:', errorMessage);
            }
          }
          
          // 保存された認証情報がない場合は未認証状態を維持
          secureLog.info('[restoreFromStorage] No saved credentials, user needs to explicitly login');
          return false;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          secureLog.error('[restoreFromStorage] Failed:', errorMessage);
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
        // セキュリティ: nsecは永続化しない（暗号化された形で別途保存）
        // nsec: undefined - 意図的に除外
      }),
    }
  )
);

