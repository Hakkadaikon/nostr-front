export type NotificationType = 'like' | 'reply' | 'repost' | 'follow' | 'mention' | 'zap';

export interface NotificationUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  npub: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  user: NotificationUser;
  content?: string;
  postId?: string;
  postContent?: string;
  amount?: number; // for zaps
  isRead: boolean;
  createdAt: Date;
}