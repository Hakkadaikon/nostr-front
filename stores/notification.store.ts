import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '../types/notification';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// モックデータ
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: {
      id: '1',
      name: 'Satoshi Nakamoto',
      username: 'satoshi',
      npub: 'npub1234...',
    },
    postId: '123',
    postContent: 'Nostrは素晴らしいプロトコルです！',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5分前
  },
  {
    id: '2',
    type: 'follow',
    user: {
      id: '2',
      name: '山田太郎',
      username: 'yamada',
      npub: 'npub5678...',
    },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30分前
  },
  {
    id: '3',
    type: 'reply',
    user: {
      id: '3',
      name: 'Alice',
      username: 'alice',
      npub: 'npub9012...',
    },
    content: 'その通りですね！分散型は未来です。',
    postId: '456',
    postContent: 'Web3の時代が来ています',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1時間前
  },
  {
    id: '4',
    type: 'zap',
    user: {
      id: '4',
      name: 'Lightning User',
      username: 'lightning',
      npub: 'npub3456...',
    },
    amount: 1000,
    postId: '789',
    postContent: '素晴らしい記事をありがとう！',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
  },
  {
    id: '5',
    type: 'repost',
    user: {
      id: '5',
      name: 'Bob Smith',
      username: 'bob',
      npub: 'npub7890...',
    },
    postId: '101',
    postContent: 'Nostrの未来は明るい',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3時間前
  },
  {
    id: '6',
    type: 'mention',
    user: {
      id: '6',
      name: 'Charlie Brown',
      username: 'charlie',
      npub: 'npub1111...',
    },
    content: '@you これを見てください！',
    postId: '202',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1日前
  },
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.isRead).length,
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      })),
      
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
    }),
    {
      name: 'notification-storage',
    }
  )
);