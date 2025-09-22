"use client";
import { useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { nip19 } from 'nostr-tools';

export function useAuth() {
  const authStore = useAuthStore();
  
  useEffect(() => {
    // Nip07の存在確認
    const hasNip07 = typeof (window as any).nostr !== 'undefined';
    authStore.setHasNip07(hasNip07);
    
    // Nip07が利用可能な場合、公開鍵を取得
    if (hasNip07 && !authStore.publicKey) {
      (async () => {
        try {
          const pubkey = await (window as any).nostr.getPublicKey();
          if (pubkey) {
            const npub = nip19.npubEncode(pubkey);
            authStore.unlock();
            useAuthStore.setState({ 
              npub, 
              publicKey: pubkey,
              locked: false 
            });
          }
        } catch (error) {
          console.error('Failed to get public key from Nip07:', error);
        }
      })();
    }
  }, []);
  
  return authStore;
}
