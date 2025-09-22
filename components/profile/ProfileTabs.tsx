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
    <nav className="flex items-center border-b border-gray-200 dark:border-gray-800">
      <div className="flex w-full overflow-x-auto scrollbar-hide">
        {TAB_CONFIG.map((tab) => {
          const isActive = tab.id === activeTab;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'relative flex min-w-max flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-all duration-200 sm:py-3.5',
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900 dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
