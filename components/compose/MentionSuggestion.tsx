"use client";

import { useEffect, useState, useRef } from 'react';
import { nip19 } from 'nostr-tools';
import type { Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../../features/relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { useAuthStore } from '../../stores/auth.store';
import { useMentionStore, type MentionProfile } from '../../stores/mention.store';
import { KIND_METADATA } from '../../lib/nostr/constants';
import { Avatar } from '../ui/Avatar';
import { getProfileImageUrl } from '../../lib/utils/avatar';

interface Profile {
  pubkey: string;
  name: string;
  displayName: string;
  picture?: string;
  npub: string;
  isFollowing?: boolean;
}

interface MentionSuggestionProps {
  query: string;
  onSelect: (profile: Profile) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

// Fuzzyマッチング関数
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // 完全一致または部分一致
  if (textLower.includes(queryLower)) return true;

  // 簡易的なfuzzyマッチング（各文字が順番に含まれているか）
  let textIndex = 0;
  for (const char of queryLower) {
    textIndex = textLower.indexOf(char, textIndex);
    if (textIndex === -1) return false;
    textIndex++;
  }
  return true;
}

export function MentionSuggestion({ query, onSelect, onClose, position }: MentionSuggestionProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { publicKey } = useAuthStore();
  const { followingProfiles, followList, prefetchFollowingProfiles } = useMentionStore();

  // フォロー中プロフィールを先読み
  useEffect(() => {
    if (publicKey) {
      prefetchFollowingProfiles(publicKey);
    }
  }, [publicKey, prefetchFollowingProfiles]);

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
    // queryが空文字列でも、フォロー中ユーザーを即座に表示
    const searchQuery = query || '';
    setSelectedIndex(0);

    // フォロー中プロフィールから即座に候補を抽出
    const followingProfilesArray = Array.from(followingProfiles.values());

    if (followingProfilesArray.length === 0) {
      // フォロー中プロフィールがない場合は空を表示
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    // フォロー中ユーザーをfuzzyマッチングでフィルタリング
    const matchedFollowing = followingProfilesArray
      .filter(p =>
        fuzzyMatch(p.name, searchQuery) ||
        fuzzyMatch(p.displayName, searchQuery) ||
        fuzzyMatch(p.npub, searchQuery)
      )
      .map(p => ({
        pubkey: p.pubkey,
        name: p.name,
        displayName: p.displayName,
        picture: getProfileImageUrl(p.picture, p.pubkey),
        npub: p.npub,
        isFollowing: true,
      }))
      .slice(0, 10); // 最大10件

    setProfiles(matchedFollowing);

    // queryが2文字以上の場合、フォロー外ユーザーも検索（デバウンス付き）
    if (searchQuery.length >= 2) {
      const debounceTimeout = setTimeout(() => {
        setIsLoading(true);

        const relaysStore = useRelaysStore.getState();
        const configuredRelays = getReadRelays(relaysStore.relays);

        if (!configuredRelays || configuredRelays.length === 0) {
          setIsLoading(false);
          return;
        }

        const foundProfiles = new Map<string, Profile>();
        const queryLower = searchQuery.toLowerCase();

        // フォロー外ユーザーも検索（全体検索）
        const filters = [{
          kinds: [KIND_METADATA],
          search: queryLower,
          limit: 20
        }];

        const sub = subscribeTo(
          configuredRelays,
          filters,
          (event: NostrEvent) => {
            try {
              // フォロー中ユーザーは既に表示されているのでスキップ
              if (followList.has(event.pubkey)) return;

              const content = JSON.parse(event.content);
              const name = content.username || content.name || '';
              const displayName = content.display_name || content.name || '';

              const matches =
                name.toLowerCase().includes(queryLower) ||
                displayName.toLowerCase().includes(queryLower);

              if (matches && !foundProfiles.has(event.pubkey)) {
                const profile: Profile = {
                  pubkey: event.pubkey,
                  name: name || nip19.npubEncode(event.pubkey).slice(0, 12),
                  displayName: displayName || name || 'Nostr User',
                  picture: getProfileImageUrl(content.picture, event.pubkey),
                  npub: nip19.npubEncode(event.pubkey),
                  isFollowing: false,
                };
                foundProfiles.set(event.pubkey, profile);
              }
            } catch (error) {
              console.error('Failed to parse profile:', error);
            }
          }
        );

        const timeoutId = setTimeout(() => {
          sub.close();

          // フォロー外ユーザーを追加（最大5件）
          const unfollowedProfiles = Array.from(foundProfiles.values()).slice(0, 5);

          // フォロー中を優先、フォロー外を後に追加
          setProfiles(prev => [...prev, ...unfollowedProfiles]);
          setIsLoading(false);
        }, 800);

        return () => {
          clearTimeout(timeoutId);
          sub.close();
        };
      }, 300); // フォロー外検索のみ300msデバウンス

      return () => {
        clearTimeout(debounceTimeout);
      };
    } else {
      setIsLoading(false);
    }
  }, [query, followingProfiles, followList]);

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-80 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {isLoading && profiles.length === 0 ? (
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
              onClick={(e) => {
                e.stopPropagation();
                onSelect(profile);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar src={profile.picture} alt={profile.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {profile.displayName}
                  </div>
                  {profile.isFollowing && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      フォロー中
                    </span>
                  )}
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
