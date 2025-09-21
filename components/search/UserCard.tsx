"use client";

import Image from 'next/image';
import Link from 'next/link';
import { User } from '../../features/timeline/types';

interface UserCardProps {
  user: User;
  onFollow?: (userId: string) => void;
}

export function UserCard({ user, onFollow }: UserCardProps) {
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* アバター */}
        <Link href={`/${user.username}` as any} className="flex-shrink-0">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={48}
              height={48}
              className="rounded-full hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </Link>

        {/* ユーザー情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/${user.username}` as any}
                className="hover:underline"
              >
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  @{user.username}
                </p>
              </Link>
              {user.bio && (
                <p className="mt-2 text-gray-900 dark:text-white">
                  {user.bio}
                </p>
              )}
            </div>

            {/* フォローボタン */}
            {onFollow && (
              <button
                onClick={() => onFollow(user.id)}
                className="ml-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-full hover:opacity-80 transition-opacity"
              >
                フォロー
              </button>
            )}
          </div>

          {/* フォロワー数 */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.followingCount.toLocaleString()}
              </span>{' '}
              フォロー中
            </span>
            <span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.followersCount.toLocaleString()}
              </span>{' '}
              フォロワー
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}