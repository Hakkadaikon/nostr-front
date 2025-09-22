"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bell, Mail, User, Settings, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/auth.store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { npub } = useAuthStore();
  
  const navItems: NavItem[] = [
    {
      label: 'ホーム',
      href: '/',
      icon: <Home size={24} />,
    },
    {
      label: '通知',
      href: '/notifications',
      icon: <Bell size={24} />,
      badge: 3, // 未読通知数の例
    },
    {
      label: 'メッセージ',
      href: '/messages',
      icon: <Mail size={24} />,
    },
    {
      label: 'プロフィール',
      href: npub ? `/profile/${npub}` : '/onboarding',
      icon: <User size={24} />,
    },
    {
      label: '設定',
      href: '/settings',
      icon: <Settings size={24} />,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* ロゴエリア */}
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">X</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Clone
          </span>
        </Link>
      </div>

      {/* メインナビゲーション */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href as any}
                  className={clsx(
                    'flex items-center gap-4 px-3 py-3 rounded-full transition-all duration-200 relative group',
                    isActive
                      ? 'text-purple-600 dark:text-purple-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-lg">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 投稿ボタン */}
      <div className="p-4">
        <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
          ポストする
        </button>
      </div>

      {/* ユーザープロファイル */}
      {npub && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link 
            href={`/profile/${npub}` as any}
            className="flex items-center gap-3 w-full hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
              <img 
                src={`https://robohash.org/${npub}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 dark:text-white">
                {npub.slice(0, 8)}...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{npub.slice(0, 12)}
              </p>
            </div>
            <MoreHorizontal size={20} className="text-gray-500" />
          </Link>
        </div>
      )}
    </aside>
  );
}