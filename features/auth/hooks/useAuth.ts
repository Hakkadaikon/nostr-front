"use client";
import { useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { nip19 } from 'nostr-tools';

export function useAuth() {
  const authStore = useAuthStore();
  
  useEffect(() => {
    // Nip07の存在確認のみ行い、自動ログインはしない
    const hasNip07 = typeof (window as any).nostr !== 'undefined';
    authStore.setHasNip07(hasNip07);
  }, []);
  
  return authStore;
}
