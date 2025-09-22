// Xクローン用の型定義

// ユーザー情報
export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
}

// ツイート（投稿）
export interface QuoteReference {
  id: string;
  relays?: string[];
}

export interface Tweet {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt?: Date;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  zapsCount: number;
  isLiked?: boolean;
  isRetweeted?: boolean;
  parentId?: string;
  quote?: QuoteReference;
  media?: TweetMedia[];
  tags?: string[][];
}

// ツイートメディア
export interface TweetMedia {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnailUrl?: string;
  altText?: string;
}

// タイムラインの種類
export type TimelineType = 'home' | 'following' | 'latest' | 'trending' | 'user';

// タイムラインのリクエストパラメータ
export interface TimelineParams {
  type: TimelineType;
  userId?: string;
  cursor?: string;
  limit?: number;
}

// タイムラインのレスポンス
export interface TimelineResponse {
  tweets: Tweet[];
  nextCursor?: string;
  hasMore: boolean;
}

// タイムラインのエラー
export interface TimelineError {
  code: string;
  message: string;
  details?: any;
}

// タイムラインの状態
export interface TimelineState {
  tweets: Tweet[];
  isLoading: boolean;
  error: TimelineError | null;
  hasMore: boolean;
  nextCursor?: string;
}