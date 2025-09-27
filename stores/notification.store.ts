import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '../types/notification';
import { fetchProfileForNotification } from '../features/profile/services/profile-cache';
import { useNotificationSettingsStore } from './notification-settings.store';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getFilteredNotifications: () => Notification[];
  updateUserProfile: (pubkey: string, data: { name?: string; username?: string; avatar?: string }) => void;
  refreshAllProfiles: () => Promise<void>;
}

// 通知の有効期限（7日間）
const NOTIFICATION_EXPIRY_DAYS = 7;

const PROFILE_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
let lastRefreshAt = 0;
let refreshInFlight: Promise<void> | null = null;
let needsInitialRefresh = false;

// createdAt が Date/string/number いずれでも比較できるように正規化
function toTimestamp(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return isNaN(t) ? 0 : t;
  }
  return 0;
}

// 期限切れの通知を削除
function filterExpiredNotifications(notifications: Notification[]): Notification[] {
  const now = Date.now();
  const expiryTime = NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  
  return notifications.filter(n => {
    const notificationTime = toTimestamp(n.createdAt as unknown);
    return now - notificationTime < expiryTime;
  });
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        const settings = useNotificationSettingsStore.getState().settings;
        
        // 設定に基づいて通知をフィルタリング
        if (!settings[notification.type]) {
          return; // 通知設定がオフの場合は追加しない
        }
        
        set((state) => {
          // 重複チェック
          if (state.notifications.find(n => n.id === notification.id)) {
            return state; // 既に存在する通知は追加しない
          }
          
          // 通知を追加（最新のものを先頭に）
          const notifications = [notification, ...state.notifications];
          
          // 古い通知を削除（最大100件まで保持）
          if (notifications.length > 100) {
            notifications.splice(100);
          }
          
          return {
            notifications,
            unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
          };
        });
      },
      
      markAsRead: (id) => set((state) => {
        const notifications = state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = notifications.filter(n => !n.isRead).length;
        return { notifications, unreadCount };
      }),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      })),
      
      clearNotifications: () => set(() => ({
        notifications: [],
        unreadCount: 0,
      })),
      
      getFilteredNotifications: () => {
        const state = get();
        const settings = useNotificationSettingsStore.getState().settings;
        
        const filtered = state.notifications.filter(notification => settings[notification.type]);
        // createdAt の新しい順（降順）で並び替え
        return filtered.sort((a, b) => toTimestamp(b.createdAt as unknown) - toTimestamp(a.createdAt as unknown));
      },

      // プロフィール部分更新（最新 metadata を受けた時に使用）
      updateUserProfile: (pubkey, data) => set((state) => {
        let changed = false;
        const notifications = state.notifications.map(n => {
          if (n.user.pubkey === pubkey) {
            const updated = { ...n, user: { ...n.user, ...data } };
            changed = true;
            return updated;
          }
          // embedded post の author にも反映
          if ((n.postAuthor as any)?.pubkey === pubkey || n.postAuthor?.id === pubkey) {
            const updated = { ...n, postAuthor: { ...n.postAuthor, ...data } };
            changed = true;
            return updated;
          }
          return n;
        });
        if (!changed) return state;
        return { ...state, notifications };
      }),

      refreshAllProfiles: async () => {
        if (typeof window === 'undefined') return;
        const state = get();
        if (state.notifications.length === 0) return;

        const uniquePubkeys = Array.from(new Set(
          state.notifications
            .map(notification => notification.user.pubkey)
            .filter((pubkey): pubkey is string => !!pubkey)
        ));

        if (uniquePubkeys.length === 0) return;

        if (refreshInFlight) return refreshInFlight;
        if (Date.now() - lastRefreshAt < PROFILE_REFRESH_INTERVAL_MS) return;

        refreshInFlight = (async () => {
          try {
            const profiles = await Promise.all(uniquePubkeys.map(async (pubkey) => {
              try {
                const profile = await fetchProfileForNotification(pubkey, { forceRefresh: true });
                return { pubkey, profile };
              } catch (error) {
                console.warn('[notifications] Failed to refresh profile for', pubkey, error);
                return null;
              }
            }));

            const profileMap = new Map<string, Notification['user']>();
            profiles.forEach((entry) => {
              if (entry) {
                profileMap.set(entry.pubkey, entry.profile);
              }
            });

            if (profileMap.size === 0) return;

            set((currentState) => {
              let changed = false;
              const notifications = currentState.notifications.map((notification) => {
                let updated = notification;
                const refreshedUser = profileMap.get(notification.user.pubkey);
                if (refreshedUser) {
                  updated = {
                    ...updated,
                    user: {
                      ...notification.user,
                      ...refreshedUser,
                    },
                  };
                  changed = true;
                }

                const postAuthorPubkey = (notification.postAuthor as any)?.pubkey || notification.postAuthor?.id;
                const refreshedPostAuthor = postAuthorPubkey ? profileMap.get(postAuthorPubkey) : undefined;
                if (refreshedPostAuthor) {
                  updated = {
                    ...updated,
                    postAuthor: {
                      ...notification.postAuthor,
                      name: refreshedPostAuthor.name,
                      username: refreshedPostAuthor.username,
                      avatar: refreshedPostAuthor.avatar,
                      npub: refreshedPostAuthor.npub,
                    },
                  };
                  changed = true;
                }
                return updated;
              });
              if (!changed) return currentState;
              return { ...currentState, notifications };
            });
          } finally {
            lastRefreshAt = Date.now();
            refreshInFlight = null;
          }
        })();

        return refreshInFlight;
      },
    }),
    {
      name: 'notification-storage',
      onRehydrateStorage: () => (state) => {
        // ストアが復元された時に期限切れの通知を削除 + createdAt を Date に正規化
        if (state) {
          // createdAt を Date へ正規化
          const normalized = state.notifications.map((n) => ({
            ...n,
            createdAt: new Date(toTimestamp(n.createdAt as unknown)),
          }));

          const filteredNotifications = filterExpiredNotifications(normalized);
          const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
          
          // 変更がある場合のみ state を更新
          if (
            filteredNotifications.length !== state.notifications.length ||
            normalized.some((n, i) => (state.notifications[i]?.createdAt as any) !== (n.createdAt as any))
          ) {
            state.notifications = filteredNotifications;
            state.unreadCount = unreadCount;
          }

          if (typeof window !== 'undefined') {
            needsInitialRefresh = true;
          }
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  const schedule = typeof queueMicrotask === 'function'
    ? queueMicrotask
    : (cb: () => void) => setTimeout(cb, 0);

  schedule(() => {
    if (needsInitialRefresh) {
      void useNotificationStore.getState().refreshAllProfiles().catch((error) => {
        console.warn('[notifications] Failed to refresh profiles after rehydrate', error);
      });
      needsInitialRefresh = false;
    }
  });
}
