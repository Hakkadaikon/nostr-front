"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCard } from '../../../../components/search/UserCard';
import { Spinner } from '../../../../components/ui/Spinner';
import { fetchUserFollowList } from '../../../../features/profile/follow';
import { decode } from '../../../../lib/nostr/nip19';
import { User } from '../../../../features/timeline/types';
import { ArrowLeft } from 'lucide-react';

type Props = { params: { npub: string } };

export default function FollowingPage({ params }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  let pubkey: string | undefined;
  try {
    if (params.npub && !Array.isArray(params.npub)) {
      const decoded = decode(params.npub);
      pubkey = decoded.data as string;
    }
  } catch (err) {
    console.error('Failed to decode npub:', err);
    pubkey = undefined;
  }

  useEffect(() => {
    const loadFollowing = async () => {
      if (!pubkey) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const followingList = await fetchUserFollowList(pubkey, 'following');
        setFollowing(followingList);
      } catch (error) {
        console.error('Failed to load following list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowing();
  }, [pubkey]);

  const handleBack = () => {
    router.push(`/profile/${params.npub}`);
  };

  return (
    <div className="min-h-screen bg-gray-100/80 dark:bg-black">
      <header className="sticky top-0 z-20 bg-gray-100/95 backdrop-blur-sm dark:bg-black/95 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">フォロー中</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {following.length} ユーザー
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner />
          </div>
        ) : following.length > 0 ? (
          <div className="space-y-4">
            {following.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              まだ誰もフォローしていません
            </p>
          </div>
        )}
      </main>
    </div>
  );
}