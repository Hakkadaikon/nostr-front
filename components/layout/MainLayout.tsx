"use client";

import { ReactNode } from 'react';
import NavSidebar from './NavSidebar';
import ComposeModal from '../compose/ComposeModal';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { ThemeProvider } from '../providers/ThemeProvider';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLoadNip65Relays } from '../../features/relays/hooks/useLoadNip65Relays';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Initialize authentication (NIP-07) on app load
  useAuth();
  // Load relays from NIP-65 (kind:10002) when pubkey is ready
  useLoadNip65Relays();

  const pathname = usePathname();
  const isProfile = pathname?.startsWith('/profile');

  const innerContainerClass = clsx(
    'mx-auto min-h-screen',
    isProfile
      ? 'max-w-6xl'
      : 'max-w-2xl md:border-x border-gray-200 dark:border-gray-800'
  );

  return (
    <ThemeProvider>
      {/* モバイルヘッダー */}
      <MobileHeader />
      
      <div className="flex min-h-screen">
        {/* デスクトップサイドバー */}
        <NavSidebar />
        
        {/* メインコンテンツエリア */}
        <div className="flex-1 md:ml-72">
          <div className={innerContainerClass}>
            {/* モバイル時の上部余白 */}
            <div className="md:hidden h-14" />
            {children}
            {/* モバイル時の下部余白 */}
            <div className="md:hidden h-16" />
          </div>
        </div>
        
        {/* 右サイドバー（将来的な拡張用） */}
        <div className="hidden xl:block w-80 p-4">
          {/* トレンド、おすすめユーザーなどを表示予定 */}
        </div>
      </div>
      
      {/* モバイルナビゲーション */}
      <MobileNav />
      
      {/* グローバルモーダル */}
      <ComposeModal />
    </ThemeProvider>
  );
}
