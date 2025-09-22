"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, User, Bell, Search, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationStore } from '../../stores/notification.store';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';

const mobileNavItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/explore', label: '検索', icon: Search },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/profile', label: 'プロフィール', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const npub = useAuthStore((state) => state.npub);
  const openComposeModal = useUiStore((state) => state.openComposeModal);

  return (
    <>
      {/* モバイル下部ナビゲーション */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="grid grid-cols-4 h-16">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            const actualHref = href === '/profile' && npub ? `/profile/${npub}` : href;
            
            return (
              <Link
                key={href}
                href={actualHref as any}
                className={clsx(
                  'flex flex-col items-center justify-center py-2 relative',
                  'transition-all duration-200',
                  isActive 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                )}
              >
                <div className="relative">
                  <Icon 
                    className={clsx(
                      'w-6 h-6 transition-all duration-200',
                      isActive && 'scale-110'
                    )} 
                  />
                  {href === '/notifications' && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
                <span className="text-[10px] mt-1">{label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-purple-600 dark:bg-purple-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 浮動投稿ボタン（オプション） */}
      <button
        onClick={openComposeModal}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-50"
        aria-label="新しい投稿を作成"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
