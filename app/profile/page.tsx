'use client';

import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '../../components/ui/Spinner';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
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
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-gray-50 px-4 dark:bg-black">
      <div className="text-center">
        <Spinner className="mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          {t('common.loading')}
        </p>
      </div>
    </div>
  );
}