"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Zap, User, Bell, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationStore } from '../../stores/notification.store';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { fetchProfile } from '../../features/profile/fetchProfile';
import type { Profile } from '../../features/profile/types';
import { useUiStore } from '../../stores/ui.store';
import ThemeToggle from './ThemeToggle';
import { SafeImage } from '../ui/SafeImage';

const navItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/explore', label: '検索', icon: Search },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/profile', label: 'プロフィール', icon: User },
  { href: '/settings', label: '設定', icon: Settings },
];

export default function NavSidebar() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const npub = useAuthStore((state) => state.npub);
  const openComposeModal = useUiStore((state) => state.openComposeModal);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!npub) return;
    
    setIsLoading(true);
    fetchProfile(npub)
      .then((data) => {
        setProfile({
          npub,
          name: data.name || data.display_name,
          about: data.about,
          picture: data.picture,
        });
      })
      .catch(() => {
        setProfile({ npub });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [npub]);

  return (
    <aside className="hidden md:flex flex-col w-72 px-4 py-6 space-y-6 sticky top-0 h-screen overflow-y-auto">
      <Link 
        href="/" 
        className="flex items-center space-x-3 px-4 hover:opacity-80 transition-opacity duration-200"
        aria-label="ホームへ戻る"
      >
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Nostr
        </span>
      </Link>

      {/* Profile Section */}
      {npub && (
        <Link
          href={`/profile/${npub}` as any}
          className="block px-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md cursor-pointer group"
          aria-label="View your profile"
        >
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            ) : profile?.picture ? (
              <SafeImage
                src={profile.picture}
                alt={profile.name || 'Profile'}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-600/20 group-hover:ring-purple-600/40 transition-all duration-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                    {profile?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {npub.slice(0, 8)}...{npub.slice(-4)}
                  </p>
                </>
              )}
            </div>
          </div>
          {profile?.about && !isLoading && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {profile.about}
            </p>
          )}
        </Link>
      )}

      <nav aria-label="Primary" className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href as any}
              className={clsx(
                'flex items-center space-x-3 py-3 rounded-xl transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'group relative overflow-hidden',
                isActive ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 pl-7 pr-4' : 'px-4'
              )}
            >
              <div className="relative z-10">
                <Icon 
                  className={clsx(
                    'w-5 h-5 transition-all duration-200',
                    isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300',
                    'group-hover:scale-110'
                  )} 
                />
                {href === '/notifications' && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <span 
                className={clsx(
                  'font-medium relative z-10 transition-colors duration-200',
                  isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200'
                )}
              >
                {label}
              </span>
              
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-purple-600 dark:bg-purple-400 rounded-r-full" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 space-y-4">
        <button 
          onClick={openComposeModal}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          aria-label="新しい投稿を作成"
        >
          投稿する
        </button>
        
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}