import { SearchParams, SearchResult, Trend } from '../types';
import { Tweet, User } from '../../timeline/types';

// APIエンドポイント
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// モック検索データ
const mockUsers: User[] = [
  {
    id: '4',
    username: 'alice_wonder',
    name: 'Alice Wonder',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Designer and artist. Love creating beautiful things ✨',
    followersCount: 2500,
    followingCount: 180,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '5',
    username: 'tech_guru',
    name: 'Tech Guru',
    avatar: 'https://i.pravatar.cc/150?img=6',
    bio: 'Technology enthusiast | AI/ML | Building the future',
    followersCount: 5000,
    followingCount: 300,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '6',
    username: 'travel_tales',
    name: 'Travel Tales',
    avatar: 'https://i.pravatar.cc/150?img=7',
    bio: '🌍 Exploring the world one city at a time',
    followersCount: 8000,
    followingCount: 500,
    createdAt: new Date('2024-03-01'),
  },
];

const mockTweets: Tweet[] = [
  {
    id: '10',
    content: '検索機能のテストツイートです。Xクローンアプリを開発中！ #coding #webdev',
    author: mockUsers[0],
    createdAt: new Date('2024-09-21T14:00:00Z'),
    likesCount: 25,
    retweetsCount: 10,
    repliesCount: 5,
    isLiked: false,
    isRetweeted: false,
  },
  {
    id: '11',
    content: 'Next.jsとTailwind CSSでモダンなUIを構築するのは楽しい！ #nextjs #tailwindcss',
    author: mockUsers[1],
    createdAt: new Date('2024-09-21T13:00:00Z'),
    likesCount: 50,
    retweetsCount: 20,
    repliesCount: 8,
    isLiked: true,
    isRetweeted: false,
  },
  {
    id: '12',
    content: '今日は天気が良いので、外でコーディングしています ☀️ #remotework',
    author: mockUsers[2],
    createdAt: new Date('2024-09-21T12:00:00Z'),
    likesCount: 30,
    retweetsCount: 5,
    repliesCount: 3,
    isLiked: false,
    isRetweeted: false,
  },
];

// トレンドデータ
const mockTrends: Trend[] = [
  { hashtag: '#coding', count: 15234, category: 'Technology' },
  { hashtag: '#webdev', count: 12890, category: 'Technology' },
  { hashtag: '#nextjs', count: 9876, category: 'Technology' },
  { hashtag: '#tailwindcss', count: 8765, category: 'Technology' },
  { hashtag: '#remotework', count: 6543, category: 'Lifestyle' },
  { hashtag: '#AI', count: 25432, category: 'Technology' },
  { hashtag: '#MachineLearning', count: 18765, category: 'Technology' },
  { hashtag: '#Travel', count: 14567, category: 'Lifestyle' },
];

/**
 * 検索を実行
 */
export async function searchContent(params: SearchParams): Promise<SearchResult> {
  try {
    // 開発環境ではモックデータを返す
    if (process.env.NODE_ENV === 'development' || !API_BASE_URL.startsWith('http')) {
      // モック用の遅延
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const query = params.query.toLowerCase();
      
      // ユーザー検索
      const filteredUsers = params.type === 'tweets' ? [] : 
        mockUsers.filter(user => 
          user.name.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.bio && user.bio.toLowerCase().includes(query))
        );
      
      // ツイート検索
      const filteredTweets = params.type === 'users' ? [] :
        mockTweets.filter(tweet => 
          tweet.content.toLowerCase().includes(query)
        );
      
      return {
        users: filteredUsers,
        tweets: filteredTweets,
        hasMore: false,
      };
    }

    // 本番環境ではAPIを呼び出す
    const url = new URL(`${API_BASE_URL}/search`);
    url.searchParams.set('q', params.query);
    url.searchParams.set('type', params.type);
    
    if (params.cursor) {
      url.searchParams.set('cursor', params.cursor);
    }
    
    if (params.limit) {
      url.searchParams.set('limit', params.limit.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to search:', error);
    throw error;
  }
}

/**
 * トレンドを取得
 */
export async function fetchTrends(): Promise<Trend[]> {
  try {
    if (process.env.NODE_ENV === 'development' || !API_BASE_URL.startsWith('http')) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTrends.slice(0, 10);
    }

    const response = await fetch(`${API_BASE_URL}/trends`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    throw error;
  }
}