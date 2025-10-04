"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { UserCard } from '../search/UserCard';
import { Spinner } from '../ui/Spinner';
import { User } from '../../features/timeline/types';
import { fetchUserFollowList } from '../../features/profile/follow';
import { nip19 } from 'nostr-tools';

interface FollowListProps {
  npub: string;
  type: 'following' | 'followers';
}

export function FollowList({ npub, type }: FollowListProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFollowList = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // npubからpubkeyに変換
        const decoded = nip19.decode(npub);
        if (decoded.type !== 'npub') {
          throw new Error('Invalid npub');
        }
        const pubkey = decoded.data as string;

        // フォロー/フォロワーリストを取得
        const followList = await fetchUserFollowList(pubkey, type);
        setUsers(followList);
      } catch (err) {
        console.error('Failed to load follow list:', err);
        setError('フォロー一覧の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowList();
  }, [npub, type]);

  const handleBack = () => {
    router.back();
  };

  const handleFollow = async (userId: string) => {
    // TODO: フォロー機能の実装
  };

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
          <button
            onClick={handleBack}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">
              {type === 'following' ? 'フォロー中' : 'フォロワー'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {users.length} 人
            </p>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {type === 'following' ? 'まだ誰もフォローしていません' : 'まだフォロワーがいません'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onFollow={type === 'following' ? undefined : handleFollow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}