export type NotificationType = 'like' | 'reply' | 'repost' | 'follow' | 'mention' | 'zap';

export interface NotificationUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  npub: string;
  pubkey: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  user: NotificationUser;
  content?: string;
  postId?: string;
  postContent?: string;
  postAuthor?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
    npub?: string;
  };
  postCreatedAt?: Date;
  postMedia?: Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  }>;
  amount?: number; // for zaps
  isRead: boolean;
  createdAt: Date;
}