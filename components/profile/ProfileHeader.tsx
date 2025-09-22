"use client";

import { useState } from 'react';
import { Profile } from '../../features/profile/types';
import { SafeImage } from '../ui/SafeImage';
import { Button } from '../ui/Button';
import { Calendar, Globe, Zap, Shield, Edit2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onFollowClick?: () => void;
  isFollowing?: boolean;
}

export function ProfileHeader({ 
  profile, 
  isOwnProfile = false, 
  onEditClick,
  onFollowClick,
  isFollowing = false
}: ProfileHeaderProps) {
  const [bannerError, setBannerError] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* バナー画像 */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-purple-500 to-pink-500 relative">
        {profile.banner && !bannerError && (
          <SafeImage
            src={profile.banner}
            alt="プロフィールバナー"
            fill
            className="object-cover"
            onError={() => setBannerError(true)}
          />
        )}
      </div>

      {/* プロフィール情報 */}
      <div className="px-4 pb-4">
        <div className="flex justify-between items-start -mt-16 mb-4">
          {/* アバター */}
          <div className="relative">
            {profile.picture ? (
              <SafeImage
                src={profile.picture}
                alt={profile.name || 'プロフィール画像'}
                width={128}
                height={128}
                className="rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-900"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white dark:border-gray-900" />
            )}
          </div>

          {/* アクションボタン */}
          <div className="mt-20">
            {isOwnProfile ? (
              <Button
                onClick={onEditClick}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                プロフィールを編集
              </Button>
            ) : (
              <Button
                onClick={onFollowClick}
                variant={isFollowing ? "secondary" : "primary"}
              >
                {isFollowing ? 'フォロー中' : 'フォロー'}
              </Button>
            )}
          </div>
        </div>

        {/* 名前と認証 */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {profile.displayName || profile.name || 'Nostr User'}
            {profile.nip05 && (
              <Shield className="text-purple-500" size={20} title="認証済み" />
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            @{profile.name || profile.npub.slice(0, 16)}...
          </p>
        </div>

        {/* 自己紹介 */}
        {profile.about && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
            {profile.about}
          </p>
        )}

        {/* メタ情報 */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-purple-500 transition-colors"
            >
              <Globe size={16} />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          
          {profile.lud16 && (
            <div className="flex items-center gap-1">
              <Zap size={16} className="text-yellow-500" />
              {profile.lud16}
            </div>
          )}

          {profile.nip05 && (
            <div className="flex items-center gap-1">
              <Shield size={16} />
              {profile.nip05}
            </div>
          )}

          <div className="flex items-center gap-1">
            <Calendar size={16} />
            参加: {formatDistanceToNow(new Date(), { addSuffix: true, locale: ja })}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="flex gap-6">
          <button className="hover:underline">
            <span className="font-bold text-gray-900 dark:text-white">
              {profile.followingCount?.toLocaleString() || '0'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">フォロー中</span>
          </button>
          <button className="hover:underline">
            <span className="font-bold text-gray-900 dark:text-white">
              {profile.followersCount?.toLocaleString() || '0'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">フォロワー</span>
          </button>
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {profile.postsCount?.toLocaleString() || '0'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">ポスト</span>
          </div>
        </div>
      </div>
    </div>
  );
}