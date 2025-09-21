import { CreateTweetRequest, CreateTweetResponse } from '../types';
import { Tweet } from '../../timeline/types';

// APIエンドポイント
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// モック用のユーザー情報（開発環境用）
const mockCurrentUser = {
  id: 'current-user',
  username: 'current_user',
  name: 'Current User',
  avatar: 'https://i.pravatar.cc/150?img=10',
  bio: 'This is my bio',
  followersCount: 100,
  followingCount: 50,
  createdAt: new Date('2024-01-01')
};

/**
 * ツイートを投稿する
 */
export async function createTweet(request: CreateTweetRequest): Promise<CreateTweetResponse> {
  try {
    // 開発環境ではモック処理
    if (process.env.NODE_ENV === 'development' || !API_BASE_URL.startsWith('http')) {
      // モック用の遅延
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // バリデーション
      if (!request.content || request.content.trim() === '') {
        throw new Error('ツイートの内容を入力してください');
      }
      
      if (request.content.length > 280) {
        throw new Error('ツイートは280文字以内で入力してください');
      }
      
      // モックツイートを作成
      const newTweet: Tweet = {
        id: `tweet-${Date.now()}`,
        content: request.content,
        author: mockCurrentUser,
        createdAt: new Date(),
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0,
        isLiked: false,
        isRetweeted: false,
        parentId: request.parentId,
        quoteTweetId: request.quoteTweetId,
      };
      
      return { tweet: newTweet };
    }

    // 本番環境ではAPIを呼び出す
    const response = await fetch(`${API_BASE_URL}/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create tweet:', error);
    throw error;
  }
}

/**
 * ツイートを削除する
 */
export async function deleteTweet(tweetId: string): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'development' || !API_BASE_URL.startsWith('http')) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }

    const response = await fetch(`${API_BASE_URL}/tweets/${tweetId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to delete tweet:', error);
    throw error;
  }
}