"use client";

import { useEffect, useState, useRef } from 'react';
import { nip19 } from 'nostr-tools';
import type { Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../../features/relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { useAuthStore } from '../../stores/auth.store';
import { KIND_METADATA } from '../../lib/nostr/constants';
import { Avatar } from '../ui/Avatar';
import { getProfileImageUrl } from '../../lib/utils/avatar';
import { fetchFollowList } from '../../features/follow/services/follow';

interface Profile {
  pubkey: string;
  name: string;
  displayName: string;
  picture?: string;
  npub: string;
}

interface MentionSuggestionProps {
  query: string;
  onSelect: (profile: Profile) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function MentionSuggestion({ query, onSelect, onClose, position }: MentionSuggestionProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Map<string, Profile>>(new Map());
  const followListRef = useRef<Set<string>>(new Set());
  const { publicKey } = useAuthStore();

  // フォローリストを取得
  useEffect(() => {
    if (publicKey && followListRef.current.size === 0) {
      fetchFollowList(publicKey).then(followList => {
        followListRef.current = new Set(followList);
      });
    }
  }, [publicKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % profiles.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + profiles.length) % profiles.length);
      } else if (e.key === 'Enter' && profiles.length > 0) {
        e.preventDefault();
        onSelect(profiles[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [profiles, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    if (!query) {
      setProfiles([]);
      return;
    }

    // デバウンス: 100ms待ってから検索開始
    const debounceTimeout = setTimeout(() => {
      setIsLoading(true);
      setSelectedIndex(0);

      const relaysStore = useRelaysStore.getState();
      const configuredRelays = getReadRelays(relaysStore.relays);

      if (!configuredRelays || configuredRelays.length === 0) {
        setIsLoading(false);
        return;
      }

      const foundProfiles = new Map<string, Profile>();
      const queryLower = query.toLowerCase();

      // フォローリストがあれば、フォローユーザーのメタデータのみを取得
      const followList = Array.from(followListRef.current);

      // フォローリストが空の場合は何も表示しない
      if (followList.length === 0) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      const filters = [{ kinds: [KIND_METADATA], authors: followList, limit: 50 }];

      const sub = subscribeTo(
      configuredRelays,
      filters,
      (event: NostrEvent) => {
        try {
          const cached = profileCache.current.get(event.pubkey);
          if (cached) {
            const matches =
              cached.name.toLowerCase().includes(queryLower) ||
              cached.displayName.toLowerCase().includes(queryLower);
            if (matches && !foundProfiles.has(event.pubkey)) {
              foundProfiles.set(event.pubkey, cached);
            }
            return;
          }

          const content = JSON.parse(event.content);
          const name = content.username || content.name || '';
          const displayName = content.display_name || content.name || '';

          const matches =
            name.toLowerCase().includes(queryLower) ||
            displayName.toLowerCase().includes(queryLower);

          if (matches) {
            const profile: Profile = {
              pubkey: event.pubkey,
              name: name || nip19.npubEncode(event.pubkey).slice(0, 12),
              displayName: displayName || name || 'Nostr User',
              picture: getProfileImageUrl(content.picture, event.pubkey),
              npub: nip19.npubEncode(event.pubkey),
            };
            profileCache.current.set(event.pubkey, profile);
            foundProfiles.set(event.pubkey, profile);
            console.log('Matched profile:', { name, displayName, query: queryLower });
          }
        } catch (error) {
          console.error('Failed to parse profile:', error);
        }
      }
    );

      const timeoutId = setTimeout(() => {
        sub.close();

        // フォローユーザーのみを表示（最大10件）
        const allProfiles = Array.from(foundProfiles.values());
        const followedProfiles = allProfiles.filter(p => followListRef.current.has(p.pubkey)).slice(0, 10);

        setProfiles(followedProfiles);
        setIsLoading(false);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        sub.close();
      };
    }, 300);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [query]);

  if (!query) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-80 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {isLoading ? (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          検索中...
        </div>
      ) : profiles.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          ユーザーが見つかりませんでした
        </div>
      ) : (
        <ul>
          {profiles.map((profile, index) => (
            <li
              key={profile.pubkey}
              className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${
                index === selectedIndex
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => onSelect(profile)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar src={profile.picture} alt={profile.name} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {profile.displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{profile.name}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
