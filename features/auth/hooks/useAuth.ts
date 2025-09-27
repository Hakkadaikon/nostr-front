"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth.store';
import { nip19 } from 'nostr-tools';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const authStore = useAuthStore();

  useEffect(() => {
    // Nip07の存在確認
    const hasNip07 = typeof (window as any).nostr !== 'undefined';
    authStore.setHasNip07(hasNip07);

    // 保存された認証情報の復元を試みる
    authStore.restoreFromStorage().then((restored) => {
      // 認証情報がなく、オンボーディングページにいない場合はリダイレクト
      if (!restored && pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    });
  }, []);

  return authStore;
}
