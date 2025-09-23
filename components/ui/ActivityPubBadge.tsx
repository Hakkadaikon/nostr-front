"use client";

import { Globe } from 'lucide-react';

interface ActivityPubBadgeProps {
  className?: string;
  size?: 'small' | 'medium';
}

export function ActivityPubBadge({ className = '', size = 'small' }: ActivityPubBadgeProps) {
  const sizeClasses = size === 'small' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  
  return (
    <span 
      className={`inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium ${sizeClasses} ${className}`}
      title="ActivityPub経由の投稿"
    >
      <Globe className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>ActivityPub</span>
    </span>
  );
}