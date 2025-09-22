"use client";

import { ReactNode } from 'react';
import NavSidebar from './NavSidebar';
import ComposeModal from '../compose/ComposeModal';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { ThemeProvider } from '../providers/ThemeProvider';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ThemeProvider>
      {/* モバイルヘッダー */}
      <MobileHeader />
      
      <div className="flex min-h-screen">
        {/* デスクトップサイドバー */}
        <NavSidebar />
        
        {/* メインコンテンツエリア */}
        <div className="flex-1 md:ml-72">
          <div className="max-w-2xl mx-auto md:border-x border-gray-200 dark:border-gray-800 min-h-screen">
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