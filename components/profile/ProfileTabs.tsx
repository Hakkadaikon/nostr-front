"use client";

import clsx from 'clsx';

export type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  counts?: Partial<Record<ProfileTab, number>>;
}

const TAB_CONFIG: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: 'ノート' },
  { id: 'replies', label: '返信' },
  { id: 'media', label: 'メディア' },
  { id: 'likes', label: 'いいね' },
];

export function ProfileTabs({ activeTab, onTabChange, counts = {} }: ProfileTabsProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 px-2 dark:border-gray-800">
      {TAB_CONFIG.map((tab) => {
        const isActive = tab.id === activeTab;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/70'
            )}
          >
            <span>{tab.label}</span>
            {typeof count === 'number' && (
              <span
                className={clsx(
                  'min-w-[2.25rem] rounded-full px-2 py-0.5 text-center text-xs',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-200'
                )}
              >
                {count.toLocaleString()}
              </span>
            )}
            {isActive && (
              <span className="absolute -bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-purple-600" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
