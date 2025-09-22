"use client";

import { useState } from 'react';
import { Tabs } from '../ui/Tabs';

export type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { id: 'posts' as ProfileTab, label: 'ポスト' },
    { id: 'replies' as ProfileTab, label: '返信' },
    { id: 'media' as ProfileTab, label: 'メディア' },
    { id: 'likes' as ProfileTab, label: 'いいね' },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}