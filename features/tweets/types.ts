import { Tweet, User } from '../timeline/types';

// ツイート作成のリクエスト
export interface CreateTweetRequest {
  content: string;
  parentId?: string; // 返信の場合
  quoteTweetId?: string; // 引用ツイートの場合
  media?: File[]; // 添付メディアファイル
  hashtags?: string[]; // ハッシュタグ
  mentions?: string[]; // メンション
}

// ツイート作成のレスポンス
export interface CreateTweetResponse {
  tweet: Tweet;
}

// ツイート削除のレスポンス
export interface DeleteTweetResponse {
  success: boolean;
}

// ツイート作成エラー
export interface TweetError {
  code: string;
  message: string;
  details?: any;
}