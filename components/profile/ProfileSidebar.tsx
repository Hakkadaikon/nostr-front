"use client";

import { useState } from 'react';
import { Profile } from '../../features/profile/types';
import { Copy, Check, Globe, ShieldCheck, Zap, Link2 } from 'lucide-react';
import clsx from 'clsx';

interface ProfileSidebarProps {
  profile: Profile;
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNpub = async () => {
    try {
      await navigator.clipboard.writeText(profile.npub);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
    }
  };

  const website = profile.website
    ? profile.website.startsWith('http')
      ? profile.website
      : `https://${profile.website}`
    : null;

  return (
    <aside className="space-y-4 sm:space-y-6">
      {profile.about && (
        <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <h2 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            自己紹介
          </h2>
          <p className="whitespace-pre-wrap text-xs sm:text-sm leading-5 sm:leading-6 text-gray-700 dark:text-gray-200">
            {profile.about}
          </p>
        </section>
      )}

      <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        <h2 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          プロフィール情報
        </h2>
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          {website && (
            <li className="flex items-center gap-2 sm:gap-3">
              <Globe size={16} className="text-purple-500" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-purple-600 hover:underline dark:text-purple-300"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            </li>
          )}

          {profile.nip05 && (
            <li className="flex items-center gap-2 sm:gap-3">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="truncate">{profile.nip05}</span>
            </li>
          )}

          {profile.lud16 && (
            <li className="flex items-center gap-2 sm:gap-3">
              <Zap size={16} className="text-yellow-500" />
              <span className="truncate">{profile.lud16}</span>
            </li>
          )}

          <li className="flex items-start gap-2 sm:gap-3">
            <Link2 size={16} className="mt-0.5 sm:mt-1 text-gray-400" />
            <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs text-gray-600 dark:bg-gray-800/70 dark:text-gray-300">
              <span className="truncate">{profile.npub}</span>
              <button
                type="button"
                onClick={handleCopyNpub}
                className={clsx(
                  'inline-flex items-center gap-0.5 sm:gap-1 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold transition-colors',
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                )}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'コピー済' : 'コピー'}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </aside>
  );
}
