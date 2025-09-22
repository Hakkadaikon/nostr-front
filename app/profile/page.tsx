'use client';

import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '../../components/ui/Spinner';

export default function ProfilePage() {
  const { npub, locked } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Nip07の認証待ち
    if (locked) {
      return;
    }

    if (npub) {
      // 自分のプロフィールページにリダイレクト
      router.replace(`/profile/${npub}`);
    } else {
      // 未ログインの場合はオンボーディングページへ
      router.replace('/onboarding');
    }
  }, [npub, locked, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          プロフィールを読み込んでいます...
        </p>
      </div>
    </div>
  );
}