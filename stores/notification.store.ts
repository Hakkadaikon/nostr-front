import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '../types/notification';
import { useNotificationSettingsStore } from './notification-settings.store';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getFilteredNotifications: () => Notification[];
}

// 通知の有効期限（7日間）
const NOTIFICATION_EXPIRY_DAYS = 7;

// 期限切れの通知を削除
function filterExpiredNotifications(notifications: Notification[]): Notification[] {
  const now = Date.now();
  const expiryTime = NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  
  return notifications.filter(n => {
    const notificationTime = n.createdAt.getTime();
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
        
        return state.notifications.filter(notification => 
          settings[notification.type]
        );
      },
    }),
    {
      name: 'notification-storage',
      onRehydrateStorage: () => (state) => {
        // ストアが復元された時に期限切れの通知を削除
        if (state) {
          const filteredNotifications = filterExpiredNotifications(state.notifications);
          const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
          
          if (filteredNotifications.length !== state.notifications.length) {
            state.notifications = filteredNotifications;
            state.unreadCount = unreadCount;
          }
        }
      },
    }
  )
);