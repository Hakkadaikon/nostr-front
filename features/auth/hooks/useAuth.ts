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

    // 保存された認証情報の復元
    authStore.restoreFromStorage();
  }, []);

  return authStore;
}
