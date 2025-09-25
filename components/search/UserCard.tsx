"use client";

import Link from 'next/link';
import { SafeImage } from '../ui/SafeImage';
import { User } from '../../features/timeline/types';
import { Button } from '../ui/Button';
import { ActivityPubBadge } from '../ui/ActivityPubBadge';
import { isActivityPubUser } from '../../lib/utils/activitypub';

interface UserCardProps {
  user: User;
  onFollow?: (userId: string) => void;
}

export function UserCard({ user, onFollow }: UserCardProps) {
  return (
    <div className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors overflow-hidden">
      <div className="flex items-start gap-2 sm:gap-3">
        {/* アバター */}
        <Link href={`/profile/${user.npub || user.id}` as any} className="flex-shrink-0">
          {user.avatar ? (
            <SafeImage
              src={user.avatar}
              alt={user.name}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </Link>

        {/* ユーザー情報 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-hidden">
              <Link
                href={`/profile/${user.npub || user.id}` as any}
                className="hover:underline"
              >
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2 flex-wrap">
                  <span className="truncate">{user.name}</span>
                  {isActivityPubUser(user) && (
                    <ActivityPubBadge size="small" />
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>
              </Link>
              {user.bio && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2">
                  {user.bio}
                </p>
              )}
            </div>

            {/* フォローボタン */}
            {onFollow && (
              <Button
                onClick={() => onFollow(user.id)}
                variant="primary"
                size="small"
                className="self-start sm:ml-4 flex-shrink-0"
              >
                フォロー
              </Button>
            )}
          </div>

          {/* フォロワー数 - 高速化のため非表示 */}
        </div>
      </div>
    </div>
  );
}