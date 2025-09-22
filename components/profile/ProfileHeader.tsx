"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Profile } from '../../features/profile/types';
import { SafeImage } from '../ui/SafeImage';
import { Button } from '../ui/Button';
import {
  Share2,
  Zap,
  Globe2,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onFollowClick?: () => void;
  isFollowing?: boolean;
  followCount?: number | null;
  followerCount?: number | null;
  postCount?: number | null;
}

export function ProfileHeader({
  profile,
  isOwnProfile = false,
  onEditClick,
  onFollowClick,
  isFollowing = false,
  followCount,
  followerCount,
  postCount,
}: ProfileHeaderProps) {
  const [bannerError, setBannerError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const displayName = profile.displayName || profile.name || 'Nostrユーザー';
  const username = profile.name || profile.npub.slice(0, 12);
  const truncatedNpub = `${profile.npub.slice(0, 8)}...${profile.npub.slice(-6)}`;
  const avatarSrc = profile.picture || '';

  

  const cleanWebsite = profile.website
    ? profile.website.replace(/^https?:\/\//, '')
    : null;

  const handleShare = async () => {
    const profileUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${profile.npub}`
      : `/profile/${profile.npub}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName,
          text: `${displayName} (@${username})`,
          url: profileUrl,
        });
        return;
      }
    } catch (error) {
      console.error('Share failed:', error);
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy profile link:', error);
    }
  };

  return (
    <header className="relative">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-r from-purple-700 via-pink-500 to-orange-400 md:h-56">
        {profile.banner && !bannerError && (
          <SafeImage
            src={profile.banner}
            alt={`${displayName} banner`}
            fill
            sizes="100vw"
            className="object-cover"
            onError={() => setBannerError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-6">
        <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="relative h-32 w-32 flex-shrink-0 aspect-square overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-xl dark:border-gray-950 dark:bg-gray-800">
              {avatarSrc ? (
                <SafeImage
                  src={avatarSrc}
                  alt={`${displayName} avatar`}
                  fill
                  sizes="256px"
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
              )}
            </div>

            <div className="space-y-4 text-gray-900 dark:text-white">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold md:text-3xl">
                    {displayName}
                  </h1>
                  {profile.nip05 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <ShieldCheck size={14} />
                      {profile.nip05}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                  <span>@{username}</span>
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {truncatedNpub}
                  </span>
                  {profile.lud16 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-300">
                      <Zap size={14} />
                      {profile.lud16}
                    </span>
                  )}
                  {cleanWebsite && (
                    <a
                      href={profile.website?.startsWith('http') ? profile.website : `https://${cleanWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-purple-600/10 px-3 py-1 text-xs font-semibold text-purple-600 transition hover:bg-purple-600/20 dark:bg-purple-400/10 dark:text-purple-200"
                    >
                      <Globe2 size={14} />
                      {cleanWebsite}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {postCount !== null && postCount !== undefined && (
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">{postCount.toLocaleString()}</span>{' '}
                    <span>ポスト</span>
                  </div>
                )}
                {followCount !== null && followCount !== undefined && (
                  <Link 
                    href={`/profile/${profile.npub}/following`}
                    className="hover:underline cursor-pointer"
                  >
                    <span className="font-bold text-gray-900 dark:text-white">{followCount.toLocaleString()}</span>{' '}
                    <span>フォロー中</span>
                  </Link>
                )}
                {followerCount !== null && followerCount !== undefined && (
                  <Link 
                    href={`/profile/${profile.npub}/followers`}
                    className="hover:underline cursor-pointer"
                  >
                    <span className="font-bold text-gray-900 dark:text-white">{followerCount.toLocaleString()}</span>{' '}
                    <span>フォロワー</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleShare}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-gray-800/60 dark:bg-gray-900/70 dark:text-gray-200'
              )}
            >
              <Share2 size={16} />
              {copiedLink ? 'コピーしました' : 'シェア'}
            </button>

            {isOwnProfile ? (
              <Button
                onClick={onEditClick}
                variant="primary"
              >
                プロフィールを編集
              </Button>
            ) : (
              <Button
                onClick={onFollowClick}
                variant={isFollowing ? 'secondary' : 'primary'}
              >
                {isFollowing ? 'フォロー中' : 'フォロー'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
