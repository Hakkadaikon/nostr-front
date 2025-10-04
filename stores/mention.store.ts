import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nip19 } from 'nostr-tools';
import type { Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../features/relays/services/relayPool';
import { useRelaysStore } from './relays.store';
import { KIND_METADATA } from '../lib/nostr/constants';
import { getProfileImageUrl } from '../lib/utils/avatar';
import { fetchFollowList } from '../features/follow/services/follow';

export interface MentionProfile {
  pubkey: string;
  name: string;
  displayName: string;
  picture?: string;
  npub: string;
  isFollowing: boolean;
  cachedAt: number;
}

interface MentionState {
  // フォロー中ユーザーのプロフィールキャッシュ
  followingProfiles: Map<string, MentionProfile>;
  // フォローリスト
  followList: Set<string>;
  // 最終更新時刻
  lastUpdated: number;

  // アクション
  setFollowingProfiles: (profiles: Map<string, MentionProfile>) => void;
  setFollowList: (followList: Set<string>) => void;
  addProfile: (profile: MentionProfile) => void;

  // フォロー中プロフィールを先読み
  prefetchFollowingProfiles: (pubkey: string) => Promise<void>;

  // キャッシュクリア
  clearCache: () => void;
}

// TTL: 10分（フォロー中ユーザーは頻繁に変わらないため長めに設定）
const CACHE_TTL = 10 * 60 * 1000;

export const useMentionStore = create<MentionState>()(
  persist(
    (set, get) => ({
      followingProfiles: new Map(),
      followList: new Set(),
      lastUpdated: 0,

      setFollowingProfiles: (profiles) => set({ followingProfiles: profiles }),
      setFollowList: (followList) => set({ followList }),
      addProfile: (profile) => set((state) => {
        const newProfiles = new Map(state.followingProfiles);
        newProfiles.set(profile.pubkey, profile);
        return { followingProfiles: newProfiles };
      }),

      prefetchFollowingProfiles: async (pubkey: string) => {
        const state = get();
        const now = Date.now();

        // キャッシュが有効な場合はスキップ
        if (state.lastUpdated && now - state.lastUpdated < CACHE_TTL) {
          return;
        }


        try {
          // フォローリストを取得
          const followList = await fetchFollowList(pubkey);
          const followSet = new Set(followList);

          if (followList.length === 0) {
            set({ followList: followSet, lastUpdated: now });
            return;
          }

          set({ followList: followSet });

          // リレー設定を取得
          const relaysStore = useRelaysStore.getState();
          const relays = getReadRelays(relaysStore.relays);

          if (!relays || relays.length === 0) {
            set({ lastUpdated: now });
            return;
          }

          // フォロー中ユーザーのメタデータを一括取得
          const profiles = new Map<string, MentionProfile>();

          return new Promise<void>((resolve) => {
            const filters = [{
              kinds: [KIND_METADATA],
              authors: followList,
              limit: Math.min(followList.length, 500) // 最大500件
            }];

            const sub = subscribeTo(
              relays,
              filters,
              (event: NostrEvent) => {
                try {
                  const content = JSON.parse(event.content);
                  const name = content.username || content.name || '';
                  const displayName = content.display_name || content.name || '';
                  const npub = nip19.npubEncode(event.pubkey);

                  const profile: MentionProfile = {
                    pubkey: event.pubkey,
                    name: name || npub.slice(0, 12),
                    displayName: displayName || name || 'Nostr User',
                    picture: getProfileImageUrl(content.picture, event.pubkey),
                    npub,
                    isFollowing: true,
                    cachedAt: now,
                  };

                  profiles.set(event.pubkey, profile);
                } catch (error) {
                  console.error('[MentionStore] Failed to parse profile:', error);
                }
              }
            );

            // 2秒後にサブスクリプションを終了
            setTimeout(() => {
              sub.close();
              set({
                followingProfiles: profiles,
                lastUpdated: now
              });
              resolve();
            }, 2000);
          });
        } catch (error) {
          console.error('[MentionStore] Failed to prefetch following profiles:', error);
          set({ lastUpdated: now });
        }
      },

      clearCache: () => set({
        followingProfiles: new Map(),
        followList: new Set(),
        lastUpdated: 0
      }),
    }),
    {
      name: 'mention-store',
      // Map/Setをシリアライズ可能な形式に変換
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            state: {
              ...data.state,
              followingProfiles: new Map(Object.entries(data.state.followingProfiles || {})),
              followList: new Set(data.state.followList || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              ...value.state,
              followingProfiles: Object.fromEntries(value.state.followingProfiles),
              followList: Array.from(value.state.followList),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
