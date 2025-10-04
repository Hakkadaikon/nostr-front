"use client";

import { ReactNode, useEffect, useState } from 'react';
import NavSidebar from './NavSidebar';
import ComposeModal from '../compose/ComposeModal';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { ThemeProvider } from '../providers/ThemeProvider';
import Nip07LoginPrompt from '../auth/Nip07LoginPrompt';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLoadNip65Relays } from '../../features/relays/hooks/useLoadNip65Relays';
import { I18nProvider, getBrowserLocale } from '../../lib/i18n';
import type { SupportedLocale } from '../../lib/i18n/config';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Initialize authentication (NIP-07) on app load
  useAuth();
  // Load relays from NIP-65 (kind:10002) when pubkey is ready
  useLoadNip65Relays();

  const [locale, setLocale] = useState<SupportedLocale>('en');

  useEffect(() => {
    // クライアント側でロケールを取得
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as SupportedLocale | undefined;

    if (cookieLocale) {
      setLocale(cookieLocale);
    } else {
      // Cookieがない場合はブラウザの言語を検出
      const browserLocale = getBrowserLocale();
      setLocale(browserLocale);
      // Cookieに保存
      document.cookie = `NEXT_LOCALE=${browserLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }
  }, []);

  const innerContainerClass = 'w-full min-h-screen max-w-full lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl lg:mx-auto md:border-x border-gray-200 dark:border-gray-800';

  return (
    <I18nProvider locale={locale}>
      <ThemeProvider>
      {/* モバイルヘッダー */}
      <MobileHeader />
      
      <div className="flex min-h-screen">
        {/* デスクトップサイドバー */}
        <NavSidebar />
        
        {/* メインコンテンツエリア */}
        <div className="flex-1">
          <div className={innerContainerClass}>
            {/* ログイン促進 */}
            {/** NOTE: グローバルにログイン促進バナーを表示（未ログイン時のみ） */}
            {/* モバイル時の上部余白 */}
            <div className="md:hidden h-14" />
            {/** Nip07LoginPrompt will render nothing if logged in */}
            <Nip07LoginPrompt />
            {children}
            {/* モバイル時の下部余白 */}
            <div className="md:hidden h-16" />
          </div>
        </div>
        
        {/* 右サイドバー（将来的な拡張用） */}
        <div className="hidden 2xl:block w-80 p-4">
          {/* トレンド、おすすめユーザーなどを表示予定 */}
        </div>
      </div>
      
      {/* モバイルナビゲーション */}
      <MobileNav />
      
      {/* グローバルモーダル */}
      <ComposeModal />
    </ThemeProvider>
    </I18nProvider>
  );
}
