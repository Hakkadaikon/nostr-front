"use client";

import Link from 'next/link';
import { Zap, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';

export function MobileHeader() {
  const pathname = usePathname();
  const npub = useAuthStore((state) => state.npub);

  // ページタイトルの取得
  const getPageTitle = () => {
    if (pathname === '/') return 'ホーム';
    if (pathname === '/explore') return '検索';
    if (pathname === '/notifications') return '通知';
    if (pathname.startsWith('/profile')) return 'プロフィール';
    if (pathname === '/settings') return '設定';
    return 'Nostr';
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* ロゴ・ホームアバター */}
        <Link 
          href={npub ? `/profile/${npub}` : '/'} 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          aria-label={npub ? 'プロフィールを見る' : 'ホームへ戻る'}
        >
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </Link>

        {/* ページタイトル */}
        <h1 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {getPageTitle()}
        </h1>

        {/* 設定ボタン */}
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="設定"
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
      </div>
    </header>
  );
}